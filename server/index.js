const NS_PER_MS = 1_000_000;
const MS_PER_TICK = 50;
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', async function connection(ws) {
  console.log('Client connected');
  var isBurning = false;

  // Register events
  ws.on('message', function incoming(message) {
    if (message == 'thruster on') {
      isBurning = true;

      console.log('Thruster is on 🔥');
      ws.send('Thruster is on 🔥');
    } else if (message == 'thruster off') {
      isBurning = false;

      console.log('Thruster is off 💨')
      ws.send('Thruster is off 💨');
    } else {
      console.log(`Unknown message: ${message}`);
      ws.send(`Unknown message: ${message}`);
    }
  });

  ws.on('close', function () {
      console.log('Client disconnected');
  });

  // Now that there's a connection, start the server
  var blackboard = { hey: "notnull!" };
  while (ws.OPEN) {
    // Tick start
    var time = process.hrtime.bigint();

    // TODO: Run modules
    physicsMod.apply(blackboard);

    // Wait for next tick
    var time = (process.hrtime.bigint() - time) / NS_PER_MS;
    if (time > MS_PER_TICK) { console.log("Behind %i ms, skipping %i ticks", time, time / MS_PER_TICK); }
    else { await sleep(time); }
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
var physicsMod = function(blackboard) {
  const TIME_STEP = MS_PER_TICK / 1_000;
  const G_0 = 9.80665;
  const LUNAR_MASS = 7.346 * 10e22;
  const LUNAR_RADIUS = 1_737_400;
  const G = 6.6743 * 10e-11;

  const I_SP = 311;
  const THRUST = 45_040;
  const MASS_FLOW = THRUST / G_0 / I_SP;

  if (Object.hasOwn(blackboard, "position")) { blackboard.position = 15_000; }
  if (Object.hasOwn(blackboard, "velocity")) { blackboard.velocity = 0; }
  if (Object.hasOwn(blackboard, "mass")) { blackboard.mass = 16_400; }

  let lunarG = G * LUNAR_MASS / (blackboard.position ** 2);
  var acceleration = lunarG;

  if (blackboard.isBurning) {
    acceleration += THRUST / blackboard.mass;
    blackboard.mass -= MASS_FLOW * TIME_STEP;
  }

  // Update position and velocity
  blackboard.position += blackboard.velocity * TIME_STEP;
  blackboard.velocity += acceleration * TIME_STEP;
}

/**
 * Simply updates the blackboard with the given variable. The split ensures
 * that isBurning only gets updated once per tick.
 */
var controlsMod = function(blackboard, isBurning) {
  blackboard.isBurning = isBurning;
}

/**
 * Dumps the blackboard to the log
 */
var loggingMod = function(blackboard) {
  console.log(blackboard);
}
