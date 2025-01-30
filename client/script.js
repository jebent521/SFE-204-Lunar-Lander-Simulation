// Create a WebSocket instance
// and connect to the server
const socket = new WebSocket("ws://localhost:8080");

// Event listener for when
//the WebSocket connection is opened
socket.onopen = function (event) {
  // Alert the user that they are
  // connected to the WebSocket server
  alert("You are Connected to WebSocket Server");
};

// Event listener for when a message
//  is received from the server
socket.onmessage = function (event) {
  // Get the output div element
  const outputDiv = document.getElementById("output");
  // Append a paragraph with the
  //  received message to the output div
  outputDiv.innerHTML += `<p>Received <b>"${event.data}"</b> from server.</p>`;
};

// Event listener for when the
// WebSocket connection is closed
socket.onclose = function (event) {
  // Log a message when disconnected
  //  from the WebSocket server
  console.log("Disconnected from WebSocket server");
};

// Function to send a message
//  to the WebSocket server
function sendMessage() {
  // Get the message input element
  const messageInput = document.getElementById("messageInput");
  // Get the value of
  // the message input
  const message = messageInput.value;
  // Send the message to
  // the WebSocket server
  socket.send(message);
  // Clear the message input
  messageInput.value = "";
}
