import { PLAYING } from "./constants.js";

export default function enforcerMod(blackboard) {
    if (blackboard.state !== PLAYING || blackboard.health <= 0) {
        blackboard.isBurning = false;
    }
}
