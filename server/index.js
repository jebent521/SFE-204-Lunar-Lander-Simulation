const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  console.log('Client connected');

  ws.on('message', function incoming(message) {
    if (message == 'thruster on') {
      console.log('Thruster is on 🔥');
      ws.send('Thruster is on 🔥');
    } else if (message == 'thruster off') {
      console.log('Thruster is off 💨')
      ws.send('Thruster is off 💨');
    } else {
      console.log(`Unknown message: ${message}`);
      ws.send(`Unknown message: ${message}`);
    }
  });

  ws.on('close', function () {
      console.log('Client disconnected');
  });
});
