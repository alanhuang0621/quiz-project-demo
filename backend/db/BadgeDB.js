const sql = require('mssql');
const { getConnection } = require('./db_connect');
const Logger = require('../utils/logger');
const logger = new Logger('BadgeDB');

class BadgeDB {
    async getAllBadges() {
        try {
            const pool = await getConnection();
            const result = await pool.request().query('SELECT * FROM badges ORDER BY required_exp ASC');
            return result.recordset;
        } catch (error) {
            logger.error('获取所有徽章失败:', error);
            throw error;
        }
    }

    async getUserBadges(userId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT b.*, ub.awarded_at 
                    FROM badges b
                    JOIN user_badges ub ON b.badge_id = ub.badge_id
                    WHERE ub.user_id = @userId
                `);
            return result.recordset;
        } catch (error) {
            logger.error('获取用户徽章失败:', error);
            throw error;
        }
    }

    async awardBadge(userId, badgeId) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('badgeId', sql.Int, badgeId)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = @userId AND badge_id = @badgeId)
                    BEGIN
                        INSERT INTO user_badges (user_id, badge_id, awarded_at)
                        VALUES (@userId, @badgeId, GETDATE())
                    END
                `);
            return true;
        } catch (error) {
            logger.error('授予徽章失败:', error);
            throw error;
        }
    }
}

module.exports = new BadgeDB();
