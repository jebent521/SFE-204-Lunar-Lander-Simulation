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
            endedLastTick INTEGER
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
        } else {
            return ret;
        }
    }

    static removeFromDB(db, sessionID) {
        let d = db.prepare('DELETE FROM data WHERE sessionID = ?')
        d.run(sessionID);
    }

    dumpToDB(database, id) {
        let insert = database.prepare(`
            INSERT OR REPLACE INTO data(sessionID, position, velocity, fuel_mass, dry_mass, isBurning, health, state,
              endedLastTick)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        insert.run(id, this.position, this.velocity, this.fuel_mass, this.dry_mass, this.isBurning ? 1 : 0, this.health, this.state, this.endedLastTick ? 1 : 0);
    }
}