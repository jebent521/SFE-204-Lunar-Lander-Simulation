const constants = require("constants.js");

function enforcerMod(blackboard) {
    if (blackboard.state !== constants.PLAYING || blackboard.health <= 0) {
        blackboard.isBurning = false;
    }
}

module.exports = enforcerMod;