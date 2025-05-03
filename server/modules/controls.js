/**
 * Simply updates the blackboard with the given variable. The split ensures
 * that isBurning only gets updated once per tick.
 */
export default function controlsMod(blackboard, isBurning) {
    blackboard.isBurning = isBurning && (blackboard.health > 0);
}
