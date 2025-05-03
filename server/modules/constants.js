const MS_PER_TICK = 50;

const G_0 = 9.80665;

const I_SP = 311;
const THRUST = 45_040;
const MASS_FLOW = THRUST / G_0 / I_SP;

module.exports = {
    // Time constants
    NS_PER_MS: 1_000_000,
    MS_PER_TICK: MS_PER_TICK,
    TIME_STEP: MS_PER_TICK / 1_000,

    // Physical constants
    G_0: G_0,
    LUNAR_MASS: 7.346 * 10 ** 22,
    LUNAR_RADIUS: 1_737_400,
    G: 6.6743 * 10 ** -11,

    // Lander specs
    INVALID_MASS: -1,
    FUEL_MASS: 8_200,
    DRY_MASS: 8_200,
    I_SP: I_SP,
    THRUST: THRUST,
    MASS_FLOW: MASS_FLOW,
    WARN_VEL: -3,
    KILL_VEL: -5,

    // Game states
    MENU: "menu",
    PAUSED: "paused",
    PLAYING: "playing",
    GAME_END: "end",
}