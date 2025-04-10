let stateMod = require('./state');
let statisticsMod = require('./statistics');

class PhysicsModule {
    // Time constants
    static NS_PER_MS = 1_000_000;
    static MS_PER_TICK = 50;
    static TIME_STEP = this.MS_PER_TICK / 1_000;

    // Physical constants
    static G_0 = 9.80665;
    static LUNAR_MASS = 7.346 * 10 ** 22;
    static LUNAR_RADIUS = 1_737_400;
    static G = 6.6743 * 10 ** -11;

    // Lander specs
    static INVALID_MASS = -1;
    static FUEL_MASS = 8_200;
    static DRY_MASS = 8_200;
    static I_SP = 311;
    static THRUST = 45_040;
    static MASS_FLOW = this.THRUST / this.G_0 / this.I_SP;
    static WARN_VEL = -3;
    static KILL_VEL = -5;

    /**
     * Notes on the Lunar Module
     * Wet Mass:         16_400 kg
     * Fuel Mass:         8_200 kg
     * Dry Mass:          8_200 kg (includes ascent module)
     *
     * Thrust:           45_040 N  (if throttled, only goes from 10% - 60%)
     * Specific Impulse:    311 s  (vac, 100% throttle)
     *
     * Height:            3.231 m
     *
     * CALCULATIONS
     *
     * The mass flow can be found from the equation for specific impulse,
     * F_thrust = g_0 * I_sp * m
     * where g_0 is the standard gravity (9.80665 m/s^2), I_sp is the
     * specific impulse in seconds, and m is the mass flow rate (kg/s).
     * Solving for mass flow gives:
     * m = F_thrust / g_0 / I_sp
     * Dimensional analysis: kg/s = (kg m/s^2) / (m/s^2) / s
     */
    static run(blackboard) {
        let position = blackboard.position;
        let velocity = blackboard.velocity;
        let fuel = blackboard.fuel_mass;
        let isBurning = blackboard.isBurning;

        let lunarG = PhysicsModule.G * PhysicsModule.LUNAR_MASS / (position ** 2);
        let acceleration = -lunarG;

        if (isBurning) {
            fuel -= PhysicsModule.MASS_FLOW * PhysicsModule.TIME_STEP;

            if (fuel < 0) {
                fuel = 0;
                isBurning = false;
            } else {
                acceleration += PhysicsModule.THRUST / (fuel + blackboard.dry_mass);
            }
        }

        // Update position and velocity
        position += velocity * PhysicsModule.TIME_STEP;
        velocity += acceleration * PhysicsModule.TIME_STEP;

        let altitude = position - PhysicsModule.LUNAR_RADIUS;

        if (altitude <= 0){
            if (velocity < PhysicsModule.KILL_VEL) {

                blackboard.health = 0;
                statisticsMod.addCrash(blackboard);
            } else if (velocity < PhysicsModule.WARN_VEL) {

                blackboard.health = 100 - (velocity - PhysicsModule.WARN_VEL / (PhysicsModule.KILL_VEL - PhysicsModule.WARN_VEL) * 100);
            }

            blackboard.state = stateMod.GAME_END;
            blackboard.diedLastTick = true;
            position = PhysicsModule.LUNAR_RADIUS; velocity = 0; altitude = 0;
            statisticsMod.addLanding(blackboard);
        }

        blackboard.isBurning = isBurning;
        blackboard.fuel_mass = fuel;
        blackboard.position = position;
        blackboard.altitude = altitude;
        blackboard.velocity = velocity;
    }
}

module.exports = PhysicsModule;
