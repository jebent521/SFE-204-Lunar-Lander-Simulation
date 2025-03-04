// Create a WebSocket instance
// and connect to the server
const socket = new WebSocket("ws://localhost:8080");

const pauseMenu = document.getElementById('pauseMenu');
const startMenu = document.getElementById('startMenu');
let isStarted = false; // Has the game begun?
let isPaused = true;   // Is the server running?

window.onload = function () {
  var space_bar = 32;

  window.onkeydown = function (key) {
    if(isPaused) return;
    if (key.keyCode === space_bar) {
      socket.send('isBurning,true');
    };
  };

  window.onkeyup = function (key) {
    if(isPaused) return;
    if (key.keyCode === space_bar) {
      socket.send('isBurning,false');
    };
  }
};

window.addEventListener('keydown', function(event) {
  if (event.key === '1' && isPaused) {
    startMenu.style.display = 'none';
    isStarted = true;
    isPaused = false;
  }
});

//Pause Menu
window.addEventListener('keydown', function(event) {

  if (!isStarted) { return; } // no pause menu until we start the game

  if (event.code === 'Escape') { // escape key can pause or unpause
    isPaused = !isPaused;
    pauseMenu.style.display = isPaused ? 'flex' : 'none';
  } else if (event.code === 'Enter' && isPaused) { // enter only unpauses 
    pauseMenu.style.display = 'none';
    isPaused = false;
  }
});

// Event listener for when
//the WebSocket connection is opened
socket.onopen = function (event) {
  // Alert the user that they are
  // connected to the WebSocket server
  document.getElementById("status").innerHTML = "Connection status: connected";
};

// Event listener for when a message
//  is received from the server
socket.onmessage = function (event) {
  // Parse the received JSON message
  let data = JSON.parse(event.data);

  // Switch over the keys in the JSON object
  for (let key in data) {
    switch (key) {
      case "altitude":
        const altitude = document.getElementById("altitude");
        altitude.innerHTML = `${data[key].toFixed(2)} m`;
        break;
      case "velocity":
        const velocity = document.getElementById("velocity");
        velocity.innerHTML = `${data[key].toFixed(2)} m/s`;
        break;
      case "mass":
        const mass = document.getElementById("mass");
        mass.innerHTML = `${data[key].toFixed()} kg`;
        break;
      case "isBurning":
        const thrusters = document.getElementById("thrusters");
        thrusters.innerHTML = data[key] ? "ON" : "OFF";
        break;
      case "health":
        const health = document.getElementById("health");
        health.innerHTML = data[key].toFixed();
        break;
      case "stats":
        const stats = document.getElementById("stats");
        stats.innerHTML = "<tr><th>Statistic</th><th>Value</th></tr>";
        let statsData = data[key];
        for (let statKey in statsData) {
          const result = statKey.replace(/([A-Z])/g, " $1");
          const statKeyFormatted = result.charAt(0).toUpperCase() + result.slice(1);
          let data = statsData[statKey];
          if (statKey.toLowerCase().includes('altitude')) {
            data = `${data} m`;
          }
          stats.innerHTML += `<tr><td>${statKeyFormatted}</td><td>${data}</td></tr>`;
        }
        break;
      // Add more cases as needed for other keys
      default:
        console.log(`Unknown key: ${key}`);
    }
  }
};

// Event listener for when the
// WebSocket connection is closed
socket.onclose = function (event) {
  // Log a message when disconnected
  // from the WebSocket server
  document.getElementById("status").innerHTML = "Connection status: not connected. Try starting the server and refreshing the page.";
  console.log("Disconnected from WebSocket server");
};
