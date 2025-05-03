/**
 * TALK TO THE CLIENT
 */
export default function communicationMod(blackboard, ws) {
    ws.send(JSON.stringify({
        altitude: blackboard.altitude,
        velocity: blackboard.velocity,
        mass: blackboard.fuel_mass,
        isBurning: blackboard.isBurning,
        health: blackboard.health
    }));
}
