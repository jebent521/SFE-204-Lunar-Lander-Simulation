/**
 * Dumps the blackboard to the log every timeAccel ticks.
 * When accelerated, logging becomes rather expensive and a human
 * can't read that fast anyways.
*/
function loggingMod(blackboard, numTicks, timeAccel) {
    if (numTicks % timeAccel == 0)
        console.log(blackboard);
}

module.exports = loggingMod