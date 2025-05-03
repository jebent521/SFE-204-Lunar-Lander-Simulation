import * as constants from './constants.js';

export class Blackboard {
    static createTable = function (db) {
        db.exec(`
        CREATE TABLE data(
            sessionID INTEGER PRIMARY KEY,
            position REAL,
            velocity REAL,
            fuel_mass REAL,
            dry_mass REAL,
            isBurning INTEGER,
            health REAL,
            state TEXT,
            endedLastTick INTEGER
        ) STRICT
        `);
    }

    constructor() {
        this.position = 150 + constants.LUNAR_RADIUS;
        this.velocity = 0;
        this.fuel_mass = constants.FUEL_MASS;
        this.dry_mass = constants.DRY_MASS;
        this.isBurning = false;
        this.health = 100;
        this.state = constants.MENU;
        this.endedLastTick = false;
    }
}