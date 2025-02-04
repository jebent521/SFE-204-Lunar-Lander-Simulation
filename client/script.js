// Create a WebSocket instance
// and connect to the server
const socket = new WebSocket("ws://localhost:8080");

window.onload = function () {
  var space_bar = 32;

  window.onkeydown = function (key) {
    if (key.keyCode === space_bar) {
      socket.send('thruster on');
    };
  };

  window.onkeyup = function (key) {
    if (key.keyCode === space_bar) {
      socket.send('thruster off');
    };
  }
};


// Event listener for when
//the WebSocket connection is opened
socket.onopen = function (event) {
  // Alert the user that they are
  // connected to the WebSocket server
  document.getElementById("status").innerHTML = "<p>connected</p>";
  alert("You are Connected to WebSocket Server");
};

// Event listener for when a message
//  is received from the server
socket.onmessage = function (event) {
  // Get the output div element
  const outputDiv = document.getElementById("output");
  // Append a paragraph with the
  //  received message to the output div
  outputDiv.innerHTML = `<p>Received <b>"${event.data}"</b> from server.</p>`;
};

// Event listener for when the
// WebSocket connection is closed
socket.onclose = function (event) {
  // Log a message when disconnected
  //  from the WebSocket server
  document.getElementById("status").innerHTML = "<p>not connected</p>";
  console.log("Disconnected from WebSocket server");
};