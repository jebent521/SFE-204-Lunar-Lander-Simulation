// Create a WebSocket instance
// and connect to the server
const socket = new WebSocket("ws://localhost:8080");

const pauseMenu = document.getElementById('pauseMenu');
const startMenu = document.getElementById('startMenu');
let isStarted = false; // Has the game begun?
let isPaused = true;   // Is the server running?
toggleAnimation(); // First toggle to have the stars not move in the beginning
let run_once = false; // toggle so that pressing 1 only untoggles star animation after the start screen
// and not anytime you press 1.

function stopGame() {
  startMenu.style.display = 'flex';
  isStarted = false;
  isPaused = true;

  toggleAnimation();
}

function startGame() {
  startMenu.style.display = 'none';
  isStarted = true;
  isPaused = false;

  // TODO: allow client to pick the starting mass/fuel
  const weightSelect = document.getElementById("cars")
  socket.send("fuelMass,8200");
  socket.send("dryMass," + weightSelect.value);

  toggleAnimation();
}

function pauseGame() {
  pauseMenu.style.display = 'flex';
  isPaused = true;
  toggleAnimation();
}

function unpauseGame() {
  pauseMenu.style.display = 'none';
  isPaused = false;
  toggleAnimation();
}

window.onload = function () {
  var space_bar = 32;

  window.onkeydown = function (key) {
    if (key.keyCode === space_bar && !isPaused) {
      socket.send('thruster on');
    };
  };

  window.onkeyup = function (key) {
    if (key.keyCode === space_bar && !isPaused) {
      socket.send('thruster off');
    };
  }
};

//Pause Menu
window.addEventListener('keyup', function(event){
 const pauseMenu = document.getElimentId('pauseMenu');
  if(event.code === 'Escape'){ //escape key actuvates the pause menu
if(pauseMenu.style.display === 'none'){
  pauseMenu.style.display = 'block';
  isPaused = true;
} else{
  pauseMenu.style.display = 'none';
  isPaused = false;
    }
}
if(event.code === 'Enter' && isPaused{
  pause.Menu.style.display = 'none';
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
      case "diedLastTick":
        stopGame();
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

