// Create a WebSocket instance
// and connect to the server
const socket = new WebSocket("ws://localhost:8080");

let isPaused = false; //makes everything actually stop when pause menu activates

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
  // Get the output div element
  const outputDiv = document.getElementById("output");
  // Append a paragraph with the
  //  received message to the output div
  outputDiv.innerHTML = event.data;
};

// Event listener for when the
// WebSocket connection is closed
socket.onclose = function (event) {
  // Log a message when disconnected
  //  from the WebSocket server
  document.getElementById("status").innerHTML = "Connection status: not connected. Try starting the server and refreshing the page.";
  console.log("Disconnected from WebSocket server");
};
