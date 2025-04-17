// Create a WebSocket instance
// and connect to the server
const socket = new WebSocket("ws://localhost:8080");

const pauseMenu = document.getElementById('pauseMenu');
const startMenu = document.getElementById('startMenu');

// Game states
const NOT_STARTED = 'not started';
const PLAYING = 'playing';
const PAUSED = 'paused';
const STOPPED = 'stopped';

var gameState = NOT_STARTED;
var isConnected = false;

function stopGame() {
  startMenu.style.display = 'flex';
  setAnimate(false);

  gameState = STOPPED;
}

function startGame() {
  startMenu.style.display = 'none';
  setAnimate(true);

  // TODO: allow client to pick the starting mass/fuel
  const weightSelect = document.getElementById("landerWeight")
  socket.send("fuelMass,8200");
  socket.send("dryMass," + weightSelect.value);

  gameState = PLAYING;
}

function pauseGame() {
  pauseMenu.style.display = 'flex';
  setAnimate(false);

  socket.send("isPaused,true");

  gameState = PAUSED;
}

function unpauseGame() {
  pauseMenu.style.display = 'none';
  setAnimate(true);

  socket.send("isPaused,false");

  gameState = PLAYING;
}

function altitudeToScreenPosition(altitude) {
  const maxAltitude = 15000;
  const screenHeight = window.innerHeight;
  const landerHeight = document.getElementById('lander').style.height; // height of lander image
  const moonHeight = 205.6; // magic number 🪄
  console.log(moonHeight);
  const moonPosition = screenHeight - (moonHeight + landerHeight);
  return moonPosition - (altitude / maxAltitude) * moonPosition;
}

function setLanderAltitude(altitude) {
  const position = altitudeToScreenPosition(altitude);
  const lander = document.getElementById('lander');
  lander.style.top = `${position}px`
}

const startKeys = ['Escape', 'Enter', 'Digit1'];
const pauseKey = 'Escape';
const thrusterKey = 'Space';

window.onload = () => {
  window.onkeydown = (event) => {
    const code = event.code;
    switch (gameState) {
      case NOT_STARTED:
      case STOPPED:
        if (isConnected && startKeys.includes(code)) startGame();
        break;
      case PLAYING:
        if (code == thrusterKey) socket.send('isBurning,true');
        else if (code == pauseKey) pauseGame();
        break;
      case PAUSED:
        if (startKeys.includes(code)) unpauseGame();
        break;
      default:
        console.error(`Invalid game state detected: ${gameState}`);
        return;
    }
  };

  window.onkeyup = (event) => {
    if (event.code === thrusterKey) {
      socket.send('isBurning,false');
    }
  }
}

// Event listener for when a message
//  is received from the server
socket.onmessage = (event) => {
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
        setLanderAltitude(data[key]);
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

        document.getElementById("statsDiv").style.display = "flex";
        break;
      case "diedLastTick":
        stopGame();
        break;
      case "message":
        const message = document.getElementById("menuTitle");
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
  document.getElementById("status").textContent = "Connected to the server.";
  Array.from(document.getElementsByClassName("startPrompt")).forEach((element) => {
    element.style.color = "white";
    element.style.opacity = "1";
  });
};

// Event listener for when the
// WebSocket connection is closed
socket.onclose = (_) => {
  // Log a message when disconnected
  // from the WebSocket server
  isConnected = false;
  document.getElementById("status").textContent = "Disconnected from the server. Try starting the server and refreshing the page.";
  Array.from(document.getElementsByClassName("startPrompt")).forEach((element) => {
    element.style.color = "gray";
    element.style.opacity = "0.5";
  });
  console.log("Disconnected from WebSocket server");
};
