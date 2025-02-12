const TIME_ACCELERATION = 1;

const NS_PER_MS = 1_000_000;
const MS_PER_TICK = 50;

const TIME_STEP = MS_PER_TICK / 1_000;
const G_0 = 9.80665;
const LUNAR_MASS = 7.346 * 10**22;
const LUNAR_RADIUS = 1_737_400;
const G = 6.6743 * 10**-11;

const FUEL_MASS = 8_200;
const DRY_MASS = 8_200;
const I_SP = 311;
const THRUST = 45_040;
const MASS_FLOW = THRUST / G_0 / I_SP;

const WARN_VEL = -3;
const KILL_VEL = -5;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', async function connection(ws) {
  console.log('Client connected');
  var isBurning = false;
  var isDead = false;

  // Register events
  ws.on('message', function incoming(message) {
    if (message == 'thruster on') {
      isBurning = true;
    } else if (message == 'thruster off') {
      isBurning = false;
    } else {
      console.log(`Unknown message: ${message}`);
      ws.send(`Unknown message: ${message}`);
    }
  });

  ws.on('close', function () {
      console.log('Client disconnected');
      isDead = true;
  });

  // Now that there's a connection, start the server
  var blackboard = {
    position: 15_000 + LUNAR_RADIUS,
    velocity: 0,
    mass: FUEL_MASS + DRY_MASS,
    isBurning: false,
    health: 100
  };
  console.log(blackboard);
  while (true) {
    // Tick start
    var time = process.hrtime.bigint();

    // TODO: Run modules
    controlsMod(blackboard, isBurning);
    physicsMod(blackboard);
    loggingMod(blackboard);
    communicationMod(blackboard, ws);

    // Wait for next tick
    var elapsed = Number(process.hrtime.bigint() - time)
    elapsed = elapsed / NS_PER_MS;
    if (elapsed > MS_PER_TICK / TIME_ACCELERATION) { console.log("Behind %i ms, skipping %i ticks", elapsed, elapsed / MS_PER_TICK); }
    else { 
      await sleep(MS_PER_TICK / TIME_ACCELERATION - elapsed);
      if (isDead) { break; }
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
  var mass = blackboard.mass;
  var isBurning = blackboard.isBurning;

  let lunarG = G * LUNAR_MASS / (position**2);
  var acceleration = -lunarG;

  if (isBurning) {
    mass -= MASS_FLOW * TIME_STEP;

    if (mass < DRY_MASS) {
      mass = DRY_MASS;
      isBurning = false;
    } else {
      acceleration += THRUST / mass;
    }
  }

  // Update position and velocity
  position += velocity * TIME_STEP;
  velocity += acceleration * TIME_STEP;

  altitude = position - LUNAR_RADIUS;

  if (altitude < 0){
    if (velocity < KILL_VEL) { blackboard.health = 0; }
    else if (velocity < WARN_VEL) { blackboard.health = 100 - (velocity - WARN_VEL / (KILL_VEL - WARN_VEL) * 100); }

    position = LUNAR_RADIUS; velocity = 0; altitude = 0;
  }

  blackboard.isBurning = isBurning;
  blackboard.mass = mass;
  blackboard.position = position;
  blackboard.altitude = altitude;
  blackboard.velocity = velocity;
}

/**
 * Simply updates the blackboard with the given variable. The split ensures
 * that isBurning only gets updated once per tick.
 */
function controlsMod(blackboard, isBurning) {
  blackboard.isBurning = isBurning && (blackboard.health > 0);
}

/**
 * Dumps the blackboard to the log
 */
function loggingMod(blackboard) {
  console.log(blackboard);
}

/**
 * TALK TO THE CLIENT
 */
function communicationMod(blackboard, ws) {
  ws.send("altitude," + blackboard.altitude);
  ws.send("velocity," + blackboard.velocity);
  ws.send("mass," + blackboard.mass);
  ws.send("isBurning," + blackboard.isBurning);
  ws.send("health," + blackboard.health);
}
