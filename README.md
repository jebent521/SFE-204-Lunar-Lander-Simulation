# SFE-204-Lunar-Lander-Simulation

## Description

A simulation of a moon lander. It has the following architecture:

* **Client-Server**: it is a frontend web app that connects to a
server via a websocket. The client sends its controls to the server.
The server sends back relevant data (e.g., altitude, velocity, etc.).
* **Model-View-Controller (MVC)**: the *client* is using an MVC
architecture, which disentangles the data (model), GUI (view), and
the application logic (controller).
* **Blackboard**: the *server* is using a blackboard architecture, in
which multiple modules read and modify a shared data source known as
the blackboard.

## Getting Started
### Setting up your environment
Install the proper packages with `npm i`

### Starting the server
From the project root, run
```sh
nodemon server
```

### Running the client
Run the client app by opening `index.html` in your browser or
by previewing it in VS Code.

## Controls

Hold `space` to turn the thrusters on.

Don't crash.