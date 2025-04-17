// npm modules
const WebSocket = require('ws');

const stateMod = require('./modules/state');
const MENU = stateMod.MENU;
const PAUSED = stateMod.PAUSED;
const PLAYING = stateMod.PLAYING;
const GAME_END = stateMod.GAME_END;

const statisticsMod = require('./modules/statistics');
const controlsMod = require('./modules/controls');
const loggingMod = require('./modules/logging');
const communicationMod = require('./modules/communications');
const messagesMod = require('./modules/messages');
const physicsMod = require('./modules/physics');

const TIME_ACCELERATION = 100;

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
      physicsMod.run(blackboard);
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
