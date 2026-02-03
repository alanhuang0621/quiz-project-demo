const sql = require('mssql');
const { getConnection } = require('./db_connect');
const Logger = require('../utils/logger');
const logger = new Logger('QuestionDB');

class QuestionDB {
    async getQuestionById(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT * FROM questions WHERE question_id = @id AND is_deleted = 0');
            return result.recordset[0];
        } catch (error) {
            logger.error(`获取题目 ${id} 失败:`, error);
            throw error;
        }
    }

    async getQuestionsBySubject(subjectId, limit = 100) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('subjectId', sql.Int, subjectId)
                .query(`SELECT TOP ${limit} * FROM questions WHERE subject_id = @subjectId AND is_deleted = 0 ORDER BY NEWID()`);
            return result.recordset;
        } catch (error) {
            logger.error(`获取科目 ${subjectId} 题目失败:`, error);
            throw error;
        }
    }

    async createQuestion(questionData) {
        try {
            const pool = await getConnection();
            const { subject_id, bank_id, question_type, question_content, options, correct_answer, explanation } = questionData;
            
            const result = await pool.request()
                .input('subject_id', sql.Int, subject_id)
                .input('bank_id', sql.Int, bank_id)
                .input('question_type', sql.VarChar, question_type)
                .input('question_content', sql.NVarChar, question_content)
                .input('options', sql.NVarChar, JSON.stringify(options))
                .input('correct_answer', sql.NVarChar, correct_answer)
                .input('explanation', sql.NVarChar, explanation)
                .query(`
                    INSERT INTO questions (subject_id, bank_id, question_type, question_content, options, correct_answer, explanation, create_at, is_deleted)
                    VALUES (@subject_id, @bank_id, @question_type, @question_content, @options, @correct_answer, @explanation, GETDATE(), 0);
                    SELECT SCOPE_IDENTITY() AS id;
                `);
            return result.recordset[0].id;
        } catch (error) {
            logger.error('创建题目失败:', error);
            throw error;
        }
    }

    async updateQuestion(id, questionData) {
        try {
            const pool = await getConnection();
            const { subject_id, bank_id, question_type, question_content, options, correct_answer, explanation } = questionData;
            
            await pool.request()
                .input('id', sql.Int, id)
                .input('subject_id', sql.Int, subject_id)
                .input('bank_id', sql.Int, bank_id)
                .input('question_type', sql.VarChar, question_type)
                .input('question_content', sql.NVarChar, question_content)
                .input('options', sql.NVarChar, JSON.stringify(options))
                .input('correct_answer', sql.NVarChar, correct_answer)
                .input('explanation', sql.NVarChar, explanation)
                .query(`
                    UPDATE questions 
                    SET subject_id = @subject_id, 
                        bank_id = @bank_id,
                        question_type = @question_type, 
                        question_content = @question_content, 
                        options = @options, 
                        correct_answer = @correct_answer, 
                        explanation = @explanation,
                        update_at = GETDATE()
                    WHERE question_id = @id
                `);
            return true;
        } catch (error) {
            logger.error(`更新题目 ${id} 失败:`, error);
            throw error;
        }
    }

    async deleteQuestion(id) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('id', sql.Int, id)
                .query('UPDATE questions SET is_deleted = 1 WHERE question_id = @id');
            return true;
        } catch (error) {
            logger.error(`删除题目 ${id} 失败:`, error);
            throw error;
        }
    }
}

module.exports = new QuestionDB();
