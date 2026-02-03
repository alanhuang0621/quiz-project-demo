const sql = require('mssql');
const { getConnection } = require('./db_connect');
const Logger = require('../utils/logger');
const logger = new Logger('UserDB');

class UserDB {
    async findByUsername(username) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('username', sql.VarChar, username)
                .query('SELECT * FROM users WHERE user_name = @username AND is_deleted = 0');
            return result.recordset[0];
        } catch (error) {
            logger.error(`查找用户 ${username} 失败:`, error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT * FROM users WHERE user_id = @id AND is_deleted = 0');
            return result.recordset[0];
        } catch (error) {
            logger.error(`查找用户 ID ${id} 失败:`, error);
            throw error;
        }
    }

    async createUser(userData) {
        try {
            const pool = await getConnection();
            const { username, password_hash, real_name, email, department_id, role_id } = userData;
            const result = await pool.request()
                .input('username', sql.VarChar, username)
                .input('password_hash', sql.VarChar, password_hash)
                .input('real_name', sql.NVarChar, real_name)
                .input('email', sql.VarChar, email)
                .input('department_id', sql.Int, department_id)
                .input('role_id', sql.Int, role_id)
                .query(`
                    INSERT INTO users (user_name, password_hash, real_name, email, department_id, role_id, experience, level, is_deleted)
                    VALUES (@username, @password_hash, @real_name, @email, @department_id, @role_id, 0, 1, 0);
                    SELECT SCOPE_IDENTITY() AS id;
                `);
            return result.recordset[0].id;
        } catch (error) {
            logger.error('创建用户失败:', error);
            throw error;
        }
    }

    async updateExperience(userId, exp) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('exp', sql.Int, exp)
                .query('UPDATE users SET experience = experience + @exp WHERE user_id = @userId');
            return true;
        } catch (error) {
            logger.error(`更新用户 ${userId} 经验失败:`, error);
            throw error;
        }
    }
}

module.exports = new UserDB();
