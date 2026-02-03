const sql = require('mssql');
const { getConnection } = require('./db_connect');
const Logger = require('../utils/logger');
const logger = new Logger('SubjectDB');

class SubjectDB {
    async getAllSubjects() {
        try {
            const pool = await getConnection();
            const result = await pool.request().query('SELECT * FROM subjects');
            return result.recordset;
        } catch (error) {
            logger.error('获取所有科目失败:', error);
            throw error;
        }
    }
}

module.exports = new SubjectDB();
