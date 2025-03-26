// Create a WebSocket instance
// and connect to the server
const socket = new WebSocket("ws://localhost:8080");

const pauseMenu = document.getElementById('pauseMenu');
const startMenu = document.getElementById('startMenu');
const restartMenu = document.getElementById('restartMenu');

// Game states
const NOT_STARTED = 'not started';
const PLAYING = 'playing';
const PAUSED = 'paused';
const STOPPED = 'stopped';

var gameState = NOT_STARTED;
var isConnected = false;

function stopGame() {
  restartMenu.style.display = 'flex';
  gameState = STOPPED;
}

function startGame() {
  startMenu.style.display = 'none';
  restartMenu.style.display = 'none';
  gameState = PLAYING;

  // TODO: allow client to pick the starting mass/fuel
  socket.send("fuelMass,8200");
  socket.send("dryMass,8200");
}

function pauseGame() {
  pauseMenu.style.display = 'flex';

  gameState = PAUSED;
  socket.send("isPaused,true");
}

function unpauseGame() {
  pauseMenu.style.display = 'none';

  gameState = PLAYING;
  socket.send("isPaused,false");
}

window.onload = function () {
  window.onkeyup = (event) => {
    if (event.code === 'Space') {
      socket.send('isBurning,false');
    }
  }

  window.addEventListener('keydown', (event) => {
    let code = event.code;
    switch (gameState) {
      case NOT_STARTED:
      case STOPPED:
        if ((code == 'Escape' || code == 'Enter' || code == 'Digit1')
            && isConnected) {
            startGame();
        }
        break;
      case PLAYING:
        switch (event.code) {
          case 'Space':
            socket.send('isBurning,true');
            break;
          case 'Escape':
            pauseGame();
          default:
            break;
        }
        break;
      case PAUSED:
        if (code == 'Escape' || code == 'Enter' || code == 'Digit1') {
            unpauseGame();
        }
        break;
      default:
        console.error('Invalid game state detected:', gameState);
        return;
    }
  });  
}

// Event listener for when a message
//  is received from the server
socket.onmessage = function (event) {
  // Parse the received JSON message
  var data;
  try {
    data = JSON.parse(event.data);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return;
  }

  // Switch over the keys in the JSON object
  for (const key in data) {
    switch (key) {
      case "altitude":
        const altitude = document.getElementById("altitude");
        altitude.textContent = `${data[key].toFixed(2)} m`;
        break;
      case "velocity":
        const velocity = document.getElementById("velocity");
        velocity.textContent = `${data[key].toFixed(2)} m/s`;
        break;
      case "mass":
        const mass = document.getElementById("mass");
        mass.textContent = `${data[key].toFixed()} kg`;
        break;
      case "isBurning":
        const thrusters = document.getElementById("thrusters");
        thrusters.textContent = data[key] ? "ON" : "OFF";
        break;
      case "health":
        const health = document.getElementById("health");
        health.textContent = data[key].toFixed();
        break;
      case "stats":
        const stats = document.getElementById("stats");
        var statsHtml = "<tr><th>Statistic</th><th>Value</th></tr>";
        let statsData = data[key];
        for (let statKey in statsData) {
          const result = statKey.replace(/([A-Z])/g, " $1");
          const statKeyFormatted = result.charAt(0).toUpperCase() + result.slice(1);
          let data = statsData[statKey];
          if (statKey.toLowerCase().includes('altitude')) {
            data = `${data} m`;
          }
          if (statKey.toLowerCase().includes('rate')) {
            data = `${data * 100}%`;
          }
          statsHtml += `<tr><td>${statKeyFormatted}</td><td>${data}</td></tr>`;
        }
        stats.innerHTML = statsHtml;
        break;
      case "diedLastTick":
        stopGame();
        break;
      case "message":
        const message = document.getElementById("message");
        message.innerHTML = data[key];
        break;
      // Add more cases as needed for other keys
      default:
        console.error(`Unknown key: ${key}`);
    }
  }
};

// Event listener for when
//the WebSocket connection is opened
socket.onopen = (_) => {
  // Alert the user that they are
  // connected to the WebSocket server
  isConnected = true;
  document.getElementById("status").textContent = "Connection status: connected";
};

// Event listener for when the
// WebSocket connection is closed
socket.onclose = (_) => {
  // Log a message when disconnected
  // from the WebSocket server
  isConnected = false;
  document.getElementById("status").textContent = "Connection status: not connected. Try starting the server and refreshing the page.";
  console.log("Disconnected from WebSocket server");
};
