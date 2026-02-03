const sql = require('mssql');
const { getConnection } = require('./db_connect');
const Logger = require('../utils/logger');
const logger = new Logger('DepartmentDB');

class DepartmentDB {
    async getAllDepartments() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query('SELECT * FROM department WHERE is_deleted = 0');
            return result.recordset;
        } catch (error) {
            logger.error('获取部门列表失败:', error);
            throw error;
        }
    }

    async getDepartmentById(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT * FROM department WHERE department_id = @id AND is_deleted = 0');
            return result.recordset[0];
        } catch (error) {
            logger.error(`获取部门 ${id} 失败:`, error);
            throw error;
        }
    }
}

module.exports = new DepartmentDB();
