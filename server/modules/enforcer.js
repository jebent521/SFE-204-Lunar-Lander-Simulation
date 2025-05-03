function enforcerMod(blackboard) {
    if (blackboard.state !== "playing" || blackboard.health <= 0) {
        blackboard.isBurning = false;
    }
}

module.exports = enforcerMod;