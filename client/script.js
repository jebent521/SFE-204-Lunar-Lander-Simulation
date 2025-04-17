// Get some music going
const screamSound = new Audio('./audio/wilhelm_scream_CC0.mp3');
const thrusterSound = new Audio('./audio/thrust.ogg');
const backgroundMusic = new Audio('./audio/lunar_ambient.ogg');
let backgroundPlaying = false;

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

  const health = document.getElementById("health");
  if (Number(health.textContent) <= 0) {
    screamSound.play();
  }

  updateThrusters(false);

  gameState = STOPPED;
}

function startGame() {
  startMenu.style.display = 'none';
  setAnimate(true);

  const lander = document.getElementById("wesselVessel");
  lander.hidden = false;

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

function updateThrusters(thrusterState) {
  const thrusters = document.getElementById("thrusters");
  const img = document.getElementById("wesselVessel");

  if (thrusters == null || img == null) return;

  thrusters.textContent = thrusterState ? "ON" : "OFF";

  if (thrusterState) {
    img.src = "./images/landering.gif"; // Switch to the landing animation
    thrusterSound.play();
  } else {
    img.src = "./images/lander.png"; // Reset image to default
    thrusterSound.pause();
  }
}

function preloadImages() {
  const images = [
    "./images/lander.png",
    "./images/landering.gif",
  ];
  images.forEach((src) => {
    const img = new Image();
    img.src = src; // Preload the image
  });
}
  
const startKeys = ['Escape', 'Enter', 'Digit1'];
const pauseKey = 'Escape';
const thrusterKey = 'Space';

window.onload = () => {
  preloadImages(); // Preload images to avoid delays

  window.onkeydown = (event) => {
    if (!backgroundPlaying){
      backgroundMusic.play();
      backgroundPlaying = true;
    }

    const code = event.code;
    switch (gameState) {
      case NOT_STARTED:
      case STOPPED:
        if (isConnected && startKeys.includes(code)) startGame();
        break;
      case PLAYING:
        if (code == thrusterKey)
          socket.send('isBurning,true');
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

  backgroundMusic.loop = true;
  thrusterSound.loop = true;
}

// Event listener for when a message is received from the server
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
        const altitudeValue = data[key];
        const altitudeElem = document.getElementById("altitude");
        altitudeElem.textContent = `${altitudeValue.toFixed(2)} m`;

        // Move the lander
        const lander = document.getElementById("wesselVessel");
        const screenHeight = window.innerHeight - 100;
        const maxAltitude = 150;
        const yPos = screenHeight * (1 - altitudeValue / maxAltitude);
        const clampedY = Math.max(yPos, 0);
        lander.style.top = `${clampedY}px`;
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
        updateThrusters(data[key]); // Add this to toggle thrusters and image
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
          let statData = statsData[statKey];
          if (statKey.toLowerCase().includes('altitude')) {
            statData = `${statData} m`;
          }
          if (statKey.toLowerCase().includes('rate')) {
            statData = `${statData * 100}%`;
          }
          statsHtml += `<tr><td>${statKeyFormatted}</td><td>${statData}</td></tr>`;
        }
        stats.innerHTML = statsHtml;

        document.getElementById("statsDiv").style.display = "flex";
        break;
      case "endedLastTick":
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
