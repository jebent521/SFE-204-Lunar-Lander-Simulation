// npm modules
const WebSocket = require('ws');

// Custom modules
const statisticsMod = require('./modules/statistics');
const controlsMod = require('./modules/controls');
const loggingMod = require('./modules/logging');
const communicationMod = require('./modules/communications');

const TIME_ACCELERATION = 1;

// Time constants
const NS_PER_MS = 1_000_000;
const MS_PER_TICK = 50;
const TIME_STEP = MS_PER_TICK / 1_000;

// Physical constants
const G_0 = 9.80665;
const LUNAR_MASS = 7.346 * 10**22;
const LUNAR_RADIUS = 1_737_400;
const G = 6.6743 * 10**-11;

// Lander specs
const INVALID_MASS = -1;
const FUEL_MASS = 8_200;
const DRY_MASS = 8_200;
const I_SP = 311;
const THRUST = 45_040;
const MASS_FLOW = THRUST / G_0 / I_SP;
const WARN_VEL = -3;
const KILL_VEL = -5;

// Game states
const MENU = "menu";
const PAUSED = "paused";
const PLAYING = "playing";
const GAME_END = "end";

const sleep = ms => new Promise(r => setTimeout(r, ms));

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', async function connection(ws) {
  console.log('Client connected');

  // Blackboard. These values are updated once per tick.
  var blackboard = {
    position: 15_000 + LUNAR_RADIUS,
    velocity: 0,
    fuel_mass: FUEL_MASS,
    dry_mass: DRY_MASS,
    isBurning: false,
    health: 100,
    state: "menu"
  };

  // Holding variables. These may change many times per tick, 
  // but only get copied to the blackboard once per tick
  var holder = {
    isBurning: false,
    disconnected: false,
    isPaused: false,
    fuel_mass: INVALID_MASS,
    dry_mass: INVALID_MASS,
    restart: false
  };

  // Register events
  ws.on('message', function incoming(message) {
    let [k, v] = message.toString().split(",");

    if (v == 'true') { v = true; }
    else if (v == 'false') { v = false; }

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
  statisticsMod.addAttempt(blackboard);
  while (true) {
    // Tick start
    var time = process.hrtime.bigint();

    // Process state changes
    // If in the menu, move to playing and reset the blackboard once the weight has been recieved
    // If playing, pause at will
    // If paused, unpause at will
    // If game ended, switch to menu on request and if so, reset the holder
    switch (blackboard.state) {
      case MENU:
        // When ready, start the game and reset the blackboard
        if (holder.fuel_mass > 0 && holder.dry_mass > 0) { 
          blackboard.position = 15_000 + LUNAR_RADIUS;
          blackboard.velocity = 0;
          blackboard.fuel_mass = holder.fuel_mass;
          blackboard.dry_mass = holder.dry_mass;
          blackboard.isBurning = false;
          blackboard.health = 100;
          blackboard.state = PLAYING;

          holder.isPaused = false;
        }
        break;
      case PLAYING:
        if (holder.isPaused) { blackboard.state = PAUSED; }
        break;
      case PAUSED:
        if (!holder.isPaused) { blackboard.state = PLAYING; }
        break;
      case GAME_END:
        if (holder.restart) { 
          blackboard.state = MENU;

          holder.isBurning = false;
          holder.isPaused = false;
          holder.fuel_mass = INVALID_MASS;
          holder.dry_mass = INVALID_MASS;
          holder.restart = false;
        }
        break;
    }

    if (blackboard.state == PLAYING) {
      controlsMod(blackboard, holder.isBurning);
      physicsMod(blackboard);
      statisticsMod.recordHighestAltitude(blackboard);
    }

    loggingMod(blackboard);
    communicationMod(blackboard, ws);

    // Wait for next tick
    var elapsed = Number(process.hrtime.bigint() - time)
    elapsed = elapsed / NS_PER_MS;
    if (elapsed > MS_PER_TICK / TIME_ACCELERATION) { console.log("Behind %i ms, skipping %i ticks", elapsed, elapsed / MS_PER_TICK); }
    else {
      await sleep(MS_PER_TICK / TIME_ACCELERATION - elapsed);
      if (holder.disconnected) { break; }
    }
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
function physicsMod(blackboard) {
  var position = blackboard.position;
  var velocity = blackboard.velocity;
  var fuel = blackboard.fuel_mass;
  var isBurning = blackboard.isBurning;

  let lunarG = G * LUNAR_MASS / (position**2);
  var acceleration = -lunarG;

  if (isBurning) {
    fuel -= MASS_FLOW * TIME_STEP;

    if (fuel < 0) {
      fuel = 0;
      isBurning = false;
    } else {
      acceleration += THRUST / (fuel + blackboard.dry_mass);
    }
  }

  // Update position and velocity
  position += velocity * TIME_STEP;
  velocity += acceleration * TIME_STEP;

  altitude = position - LUNAR_RADIUS;

  if (altitude <= 0){
    if (velocity < KILL_VEL) {

      blackboard.health = 0;
      statisticsMod.addCrash(blackboard);
    } else if (velocity < WARN_VEL) {

      blackboard.health = 100 - (velocity - WARN_VEL / (KILL_VEL - WARN_VEL) * 100);
    }

    blackboard.state = GAME_END;
    position = LUNAR_RADIUS; velocity = 0; altitude = 0;
    statisticsMod.addLanding(blackboard);
    ws.send(JSON.stringify({stats: statisticsMod.getCurrentStats(blackboard)}));
  }

  blackboard.isBurning = isBurning;
  blackboard.fuel_mass = fuel;
  blackboard.position = position;
  blackboard.altitude = altitude;
  blackboard.velocity = velocity;
}
