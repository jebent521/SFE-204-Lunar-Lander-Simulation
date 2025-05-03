import * as constants from './constants.js';

export class Blackboard {
    static createTable = function (db) {
        db.exec(`
        CREATE TABLE IF NOT EXISTS data(
            sessionID TEXT PRIMARY KEY,
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

    dumpToDB(database, id) {
        database.exec(`
        INSERT OR REPLACE INTO data(sessionID, position, velocity, fuel_mass, dry_mass, isBurning, health, state, 
                          endedLastTick)
        VALUES ('${id}', ${this.position}, ${this.velocity}, ${this.fuel_mass}, ${this.dry_mass}, ${this.isBurning}, ${this.health}, '${this.state}', ${this.endedLastTick})
        `);
    }
}