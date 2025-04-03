// npm modules
const WebSocket = require('ws');

const statisticsMod = require('./modules/statistics');
const controlsMod = require('./modules/controls');
const loggingMod = require('./modules/logging');
const communicationMod = require('./modules/communications');
const messagesMod = require('./modules/messages');
const physicsMod = require('./modules/physics');

const TIME_ACCELERATION = 100;

// Game states
const MENU = "menu";
const PAUSED = "paused";
const PLAYING = "playing";
const GAME_END = "end";

// Useful functions
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isDigits = /^[0-9.]+$/;

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', async function connection(ws) {
  console.log('Client connected');

  // Blackboard. These values are updated once per tick.
  let blackboard = {
    altitude: 15_000,
    position: 15_000 + physicsMod.LUNAR_RADIUS,
    velocity: 0,
    fuel_mass: physicsMod.FUEL_MASS,
    dry_mass: physicsMod.DRY_MASS,
    isBurning: false,
    health: 100,
    state: "menu",
    diedLastTick: false
  };

  // Holding variables. These may change many times per tick, 
  // but only get copied to the blackboard once per tick
  let holder = {
    isBurning: false,
    disconnected: false,
    isPaused: false,
    fuelMass: physicsMod.INVALID_MASS,
    dryMass: physicsMod.INVALID_MASS
  };

  // Register events
  ws.on('message', function incoming(message) {
    let [k, v] = message.toString().split(",");

    if (v === 'true') { v = true; }
    else if (v === 'false') { v = false; }
    else if (isDigits.test(v)) { v = Number(v); }

    if (k in holder) { holder[k] = v }
    else {
      console.log(`Unknown message: ${message}`);
      ws.send(`Unknown message: ${message}`);
    }
  });

  ws.on('close', function () {
      console.log('Client disconnected');
      holder.disconnected = true;
  });

  // Now that there's a connection, start the server
  let numTicks = 0;
  while (true) {
    // Tick start
    const time = process.hrtime.bigint();

    // Process state changes
    switch (blackboard.state) {
      // If in the menu, move to playing and reset the blackboard once the weight has been recieved
      case MENU:
        if (holder.fuelMass > 0 && holder.dryMass > 0) {
          blackboard.altitude = 15_000;
          blackboard.position = 15_000 + physicsMod.LUNAR_RADIUS;
          blackboard.velocity = 0;
          blackboard.fuel_mass = holder.fuelMass;
          blackboard.dry_mass = holder.dryMass;
          blackboard.isBurning = false;
          blackboard.health = 100;
          blackboard.state = PLAYING;

          statisticsMod.addAttempt(blackboard);

          holder.isPaused = false;
        }
        break;
      // If playing, pause at will
      case PLAYING:
        if (holder.isPaused) { blackboard.state = PAUSED; }
        break;
      // If paused, unpause at will
      case PAUSED:
        if (!holder.isPaused) { blackboard.state = PLAYING; }
        break;
      // If the game ended last tick, send the statistics, switch to menu and reset the holder
      // Then, alert the client so they can reset themselves
      case GAME_END:
        if (blackboard.diedLastTick) {
          ws.send(JSON.stringify({
            stats: statisticsMod.getCurrentStats(blackboard),
            message: `You ${messagesMod.death[Math.floor(Math.random() * messagesMod.death.length)]}`
          }));
          
          blackboard.state = MENU;

          holder.isBurning = false;
          holder.isPaused = false;
          holder.fuelMass = physicsMod.INVALID_MASS;
          holder.dryMass = physicsMod.INVALID_MASS;

          // Unlike other values, this is ping, not a state change.
          // The value doesn't matter
          ws.send(JSON.stringify({diedLastTick:true}));
          
          blackboard.diedLastTick = false;
        }
        break;
    }

    if (blackboard.state === PLAYING) {
      controlsMod(blackboard, holder.isBurning);
      physics(blackboard);
      statisticsMod.recordHighestAltitude(blackboard);
    }

    loggingMod(blackboard, numTicks, TIME_ACCELERATION);
    communicationMod(blackboard, ws);

    // Wait for next tick
    let elapsed = Number(process.hrtime.bigint() - time);
    elapsed = elapsed / physicsMod.NS_PER_MS;
    if (elapsed > physicsMod.MS_PER_TICK / TIME_ACCELERATION) { console.log("Behind %i ms, skipping %i ticks", elapsed, elapsed / physicsMod.MS_PER_TICK); }
    else {
      await sleep(physicsMod.MS_PER_TICK / TIME_ACCELERATION - elapsed);
      if (holder.disconnected) { break; }
    }

    ++numTicks;
  }
});

/**
 * Notes on the Lunar Module
 * Wet Mass:         16_400 kg
 * Fuel Mass:         8_200 kg
 * Dry Mass:          8_200 kg (includes ascent module)
 * 
 * Thrust:           45_040 N  (if throttled, only goes from 10% - 60%)
 * Specific Impulse:    311 s  (vac, 100% throttle)
 * 
 * Height:            3.231 m
 * 
 * CALCULATIONS
 * 
 * The mass flow can be found from the equation for specific impulse,
 * F_thrust = g_0 * I_sp * m
 * where g_0 is the standard gravity (9.80665 m/s^2), I_sp is the
 * specific impulse in seconds, and m is the mass flow rate (kg/s).
 * Solving for mass flow gives:
 * m = F_thrust / g_0 / I_sp
 * Dimensional analysis: kg/s = (kg m/s^2) / (m/s^2) / s
 */
function physics(blackboard) {
  let position = blackboard.position;
  let velocity = blackboard.velocity;
  let fuel = blackboard.fuel_mass;
  let isBurning = blackboard.isBurning;

  let lunarG = physicsMod.G * physicsMod.LUNAR_MASS / (position ** 2);
  let acceleration = -lunarG;

  if (isBurning) {
    fuel -= physicsMod.MASS_FLOW * physicsMod.TIME_STEP;

    if (fuel < 0) {
      fuel = 0;
      isBurning = false;
    } else {
      acceleration += physicsMod.THRUST / (fuel + blackboard.dry_mass);
    }
  }

  // Update position and velocity
  position += velocity * physicsMod.TIME_STEP;
  velocity += acceleration * physicsMod.TIME_STEP;

  let altitude = position - physicsMod.LUNAR_RADIUS;

  if (altitude <= 0){
    if (velocity < physicsMod.KILL_VEL) {

      blackboard.health = 0;
      statisticsMod.addCrash(blackboard);
    } else if (velocity < physicsMod.WARN_VEL) {

      blackboard.health = 100 - (velocity - physicsMod.WARN_VEL / (physicsMod.KILL_VEL - physicsMod.WARN_VEL) * 100);
    }

    blackboard.state = GAME_END;
    blackboard.diedLastTick = true;
    position = physicsMod.LUNAR_RADIUS; velocity = 0; altitude = 0;
    statisticsMod.addLanding(blackboard);
  }

  blackboard.isBurning = isBurning;
  blackboard.fuel_mass = fuel;
  blackboard.position = position;
  blackboard.altitude = altitude;
  blackboard.velocity = velocity;
}
