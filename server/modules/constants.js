// Time constants
export const NS_PER_MS = 1_000_000;
export const MS_PER_TICK = 50;
export const TIME_STEP = MS_PER_TICK / 1_000;

// Physical constants
export const G_0 = 9.80665;
export const LUNAR_MASS = 7.346 * 10 ** 22;
export const LUNAR_RADIUS = 1_737_400;
export const G = 6.6743 * 10 ** -11;

// Lander specs
export const INVALID_MASS = -1;
export const FUEL_MASS = 8_200;
export const DRY_MASS = 8_200;
export const I_SP = 311;
export const THRUST = 45_040;
export const MASS_FLOW = THRUST / G_0 / I_SP;
export const WARN_VEL = -3;
export const KILL_VEL = -5;

// Game states
export const MENU = "menu";
export const PAUSED = "paused";
export const PLAYING = "playing";
export const GAME_END = "end";
