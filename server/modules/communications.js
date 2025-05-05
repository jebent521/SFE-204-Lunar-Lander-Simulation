/**
 * TALK TO THE CLIENT
 */
export default function communicationMod(blackboard, sessionID, ws) {
    ws.send(JSON.stringify({
        sessionID: sessionID,
        altitude: blackboard.altitude,
        velocity: blackboard.velocity,
        mass: blackboard.fuel_mass,
        isBurning: blackboard.isBurning,
        health: blackboard.health
    }));
}
