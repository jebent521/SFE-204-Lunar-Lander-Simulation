export function addAttempt(blackboard) {
    blackboard.attempts += 1;
}

export function addLanding(blackboard) {
    blackboard.landings += 1;
}

export function addCrash(blackboard) {
    blackboard.crashes += 1;
}

export function recordHighestAltitude(blackboard) {
    blackboard.highestAltitude = Math.max(blackboard.highestAltitude, blackboard.altitude);
}

export function getCurrentStats(blackboard) {
    return {
        attempts: blackboard.attempts,
        landings: (blackboard.landings ?? 0) - (blackboard.crashes ?? 0),
        crashes: blackboard.crashes ?? 0,
        highestAltitude: blackboard.highestAltitude,
        winRate: 1 - (blackboard.crashes ?? 0) / blackboard.attempts,
        lossRate: (blackboard.crashes ?? 0) / blackboard.attempts
    }
}
