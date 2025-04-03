const INVALID = -1;
const physicsMod = {
    // Time constants
    NS_PER_MS: 1_000_000,
    MS_PER_TICK: 50,
    TIME_STEP: INVALID,

    // Physical constants
    G_0: 9.80665,
    LUNAR_MASS: 7.346 * 10 ** 22,
    LUNAR_RADIUS: 1_737_400,
    G: 6.6743 * 10 ** -11,

    // Lander specs
    INVALID_MASS: -1,
    FUEL_MASS: 8_200,
    DRY_MASS: 8_200,
    I_SP: 311,
    THRUST: 45_040,
    MASS_FLOW: INVALID,
    WARN_VEL: -3,
    KILL_VEL: -5,
};

physicsMod.TIME_STEP = physicsMod.MS_PER_TICK / 1_000;
physicsMod.MASS_FLOW = physicsMod.THRUST / physicsMod.G_0 / physicsMod.I_SP;

module.exports = physicsMod;
