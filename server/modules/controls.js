/**
 * Simply updates the blackboard with the given variable. The split ensures
 * that isBurning only gets updated once per tick.
 */
function controlsMod(blackboard, isBurning) {
    blackboard.isBurning = isBurning && (blackboard.health > 0);
}

module.exports = controlsMod;