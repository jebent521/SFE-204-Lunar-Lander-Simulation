import * as constants from './constants.js';

export class Blackboard {
    constructor() {
        this.position = 150 + constants.LUNAR_RADIUS;
        this.velocity = 0;
        this.fuel_mass = constants.FUEL_MASS;
        this.dry_mass = constants.DRY_MASS;
        this.isBurning = false;
        this.health = 100;
        this.state = constants.MENU;
        this.endedLastTick = false;
        this.attempts = 0;
        this.landings = 0;
        this.crashes = 0;
        this.altitude = 150;
        this.highestAltitude = this.altitude;
    }

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
            endedLastTick INTEGER,
            attempts INTEGER,
            landings INTEGER,
            crashes INTEGER,
            altitude REAL,
            highestAltitude REAL
        ) STRICT
        `);
    }

    static createFromDB(db, sessionID) {
        let query = db.prepare(`SELECT DISTINCT * FROM data WHERE sessionID = ? LIMIT 1`);
        let response = query.all(sessionID);

        let ret = new Blackboard();
        if (response.length > 0) {
            ret.position = response[0].position;
            ret.velocity = response[0].velocity;
            ret.fuel_mass = response[0].fuel_mass;
            ret.dry_mass = response[0].dry_mass;
            ret.isBurning = response[0].isBurning === 1;
            ret.health = response[0].health;
            ret.state = response[0].state;
            ret.endedLastTick = response[0].endedLastTick === 1;
            ret.attempts = response[0].attempts;
            ret.landings = response[0].landings;
            ret.crashes = response[0].crashes;
            ret.altitude = response[0].altitude;
            ret.highestAltitude = response[0].highestAltitude;
        }

        return ret;
    }

    static removeFromDB(db, sessionID) {
        let d = db.prepare('DELETE FROM data WHERE sessionID = ?')
        d.run(sessionID);
    }

    dumpToDB(database, id) {
        let insert = database.prepare(`
            INSERT OR REPLACE INTO data(sessionID, position, velocity, fuel_mass, dry_mass, isBurning, health, state,
              endedLastTick, attempts, landings, crashes, altitude, highestAltitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        insert.run(id, this.position, this.velocity, this.fuel_mass, this.dry_mass, this.isBurning ? 1 : 0, this.health,
            this.state, this.endedLastTick ? 1 : 0, this.attempts, this.landings, this.crashes, this.altitude,
            this.highestAltitude);
    }
}