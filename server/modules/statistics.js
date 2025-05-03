export function addAttempt(blackboard) {
    if (blackboard.hasOwnProperty("attempts")) { blackboard.attempts += 1; }
    else { blackboard.attempts = 1; }
}

export function addLanding(blackboard) {
    if (blackboard.hasOwnProperty("landings")) { blackboard.landings += 1; }
    else { blackboard.landings = 1; }
}

export function addCrash(blackboard) {
    if (blackboard.hasOwnProperty("crashes")) { blackboard.crashes += 1; }
    else { blackboard.crashes = 1; }
}

export function recordHighestAltitude(blackboard) {
    let altitude = blackboard.altitude;
    if (blackboard.hasOwnProperty("highestAltitude")) {
        let highest = blackboard.highestAltitude;
        if (altitude > highest) { blackboard.highestAltitude = altitude; }
    } else { blackboard.highestAltitude = altitude; }
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
