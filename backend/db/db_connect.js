const sql = require('mssql');
const config = require('../config/config');
const Logger = require('../utils/logger');
const logger = new Logger('db_connect');

let poolPromise = null;

async function getConnection() {
    if (poolPromise) return poolPromise;

    poolPromise = new sql.ConnectionPool(config)
        .connect()
        .then(pool => {
            logger.info('Connected to SQL Server');
            return pool;
        })
        .catch(err => {
            logger.error('Database Connection Failed! Bad Config: ', err);
            poolPromise = null;
            throw err;
        });

    return poolPromise;
}

module.exports = {
    sql,
    getConnection
};
