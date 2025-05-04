// npm modules
import { WebSocketServer } from 'ws';
import { DatabaseSync } from 'node:sqlite';

import * as statisticsMod from './modules/statistics.js';
import controlsMod from './modules/controls.js';
import loggingMod from './modules/logging.js';
import communicationMod from './modules/communications.js';
import enforcerMod from './modules/enforcer.js';
import * as messages from './modules/messages.js';
import * as constants from './modules/constants.js';
import { Blackboard } from "./modules/blackboard.js";

const TIME_ACCELERATION = 1;

// Useful functions
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isDigits = /^[0-9.]+$/;

// Database init
const database = new DatabaseSync('./data.sqlite');
Blackboard.createTable(database);

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', async function connection(socket) {
  console.log('Client connected');

  let sessionID = crypto.randomUUID();
  let blackboard = new Blackboard();

  // Holding variables. These may change many times per tick, 
  // but only get copied to the blackboard once per tick
  let holder = {
    sessionID: sessionID,
    isBurning: false,
    disconnected: false,
    isPaused: false,
    fuelMass: constants.INVALID_MASS,
    dryMass: constants.INVALID_MASS
  };

  // Register events
  socket.on('message', function incoming(message) {
    let [k, v] = message.toString().split(",", 2);

    if (v === 'true') { v = true; }
    else if (v === 'false') { v = false; }
    else if (isDigits.test(v)) { v = Number(v); }

    if (k in holder) { holder[k] = v }
    else {
      console.log(`Unknown message: ${message}`);
      socket.send(`Unknown message: ${message}`);
    }
  });

  socket.on('close', function () {
      console.log('Client disconnected');
      holder.disconnected = true;
  });

  // Now that there's a connection, start the server
  // Send the session ID
  socket.send(JSON.stringify({sessionID: sessionID}));

  let numTicks = 0;
  while (true) {
    // Tick start
    let time = process.hrtime.bigint();

    // Process state changes
    switch (blackboard.state) {
      // If in the menu, move to playing and reset the blackboard once the weight has been received
      case constants.MENU:
        // If the sessionID is updated, the client is attempting to load a previous connection. Do that, clear the old
        // (now invalid) session, and immediately jump back to the start of the loop.
        if ((holder.sessionID !== undefined) && (holder.sessionID !== sessionID)) {
          console.log('Reloading blackboard...')
          blackboard = Blackboard.createFromDB(database, holder.sessionID);
          Blackboard.removeFromDB(database, sessionID);
          sessionID = holder.sessionID;
          console.log('Reloading blackboard...')
          continue;
        }

        if (holder.fuelMass > 0 && holder.dryMass > 0) { 
          blackboard.position = 150 + constants.LUNAR_RADIUS;
          blackboard.velocity = 0;
          blackboard.fuel_mass = holder.fuelMass;
          blackboard.dry_mass = holder.dryMass;
          blackboard.isBurning = false;
          blackboard.health = 100;
          blackboard.state = constants.PLAYING;

          statisticsMod.addAttempt(blackboard);

          holder.isPaused = false;
        }
        break;
      // If playing, pause at will
      case constants.PLAYING:
        if (holder.isPaused) { blackboard.state = constants.PAUSED; }
        break;
      // If paused, unpause at will
      case constants.PAUSED:
        if (!holder.isPaused) { blackboard.state = constants.PLAYING; }
        break;
      // If the game ended last tick, send the statistics, switch to menu and reset the holder
      // Then, alert the client so they can reset themselves
      case constants.GAME_END:
        if (blackboard.endedLastTick) {

          let message = (blackboard.health > 0) 
            ? `${messages.VICTORY[Math.floor(Math.random() * messages.VICTORY.length)]}`
            : (blackboard.fuel_mass === 0) ? `You ${messages.NO_FUEL[Math.floor(Math.random() * messages.NO_FUEL.length)]}`
              : `You ${messages.DEATH[Math.floor(Math.random() * messages.DEATH.length)]}`;
          socket.send(JSON.stringify({
            stats: statisticsMod.getCurrentStats(blackboard),
            message: message
          }));
          
          blackboard.state = constants.MENU;

          holder.isBurning = false;
          holder.isPaused = false;
          holder.fuelMass = constants.INVALID_MASS;
          holder.dryMass = constants.INVALID_MASS;

          // Unlike other values, this is ping, not a state change.
          // The value doesn't matter
          socket.send(JSON.stringify({endedLastTick:true}));
          
          blackboard.endedLastTick = false;
        }
        break;
    }

    enforcerMod(blackboard);
    if (blackboard.state === constants.PLAYING) {
      controlsMod(blackboard, holder.isBurning);
      physicsMod(blackboard);
      statisticsMod.recordHighestAltitude(blackboard);
    }
    enforcerMod(blackboard);

    loggingMod(blackboard, numTicks, TIME_ACCELERATION);
    communicationMod(blackboard, sessionID, socket);

    blackboard.dumpToDB(database, sessionID);

    // Wait for next tick
    let elapsed = Number(process.hrtime.bigint() - time)
    elapsed = elapsed / constants.NS_PER_MS;
    if (elapsed > constants.MS_PER_TICK / TIME_ACCELERATION) { console.log("Behind %i ms, skipping %i ticks", elapsed, elapsed / constants.MS_PER_TICK); }
    else {
      await sleep(constants.MS_PER_TICK / TIME_ACCELERATION - elapsed);
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
function physicsMod(blackboard) {
  var position = blackboard.position;
  var velocity = blackboard.velocity;
  var fuel = blackboard.fuel_mass;
  var isBurning = blackboard.isBurning;

  let lunarG = constants.G * constants.LUNAR_MASS / (position ** 2);
  var acceleration = -lunarG;

  if (isBurning) {
    fuel -= constants.MASS_FLOW * constants.TIME_STEP;

    if (fuel < 0) {
      fuel = 0;
      isBurning = false;
    } else {
      acceleration += constants.THRUST / (fuel + blackboard.dry_mass);
    }
  }

  // Update position and velocity
  position += velocity * constants.TIME_STEP;
  velocity += acceleration * constants.TIME_STEP;

  let altitude = position - constants.LUNAR_RADIUS;

  if (altitude <= 0){
    if (velocity < constants.KILL_VEL) {

      blackboard.health = 0;
      statisticsMod.addCrash(blackboard);
    } else if (velocity < constants.WARN_VEL) {

      blackboard.health = 100 - (velocity - constants.WARN_VEL / (constants.KILL_VEL - constants.WARN_VEL) * 100);
    }

    blackboard.state = constants.GAME_END;
    blackboard.endedLastTick = true;
    position = constants.LUNAR_RADIUS; velocity = 0; altitude = 0;
    statisticsMod.addLanding(blackboard);
  }

  blackboard.isBurning = isBurning;
  blackboard.fuel_mass = fuel;
  blackboard.position = position;
  blackboard.altitude = altitude;
  blackboard.velocity = velocity;
}
