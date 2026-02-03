const questionDB = require('../db/QuestionDB');
const aiService = require('./AIService');
const Logger = require('../utils/logger');
const logger = new Logger('QuestionService');
const xlsx = require('xlsx');

class QuestionService {
    async checkAnswer(questionId, userAnswer) {
        const question = await questionDB.getQuestionById(questionId);
        if (!question) throw new Error('题目不存在');

        if (question.question_type === 'essay') {
            return await aiService.gradeAnswer(question.question_content, userAnswer, question.correct_answer);
        }

        let isCorrect = false;
        const correctAnswer = question.correct_answer;

        switch (question.question_type) {
            case 'single':
                isCorrect = String(userAnswer) === String(correctAnswer);
                break;
            case 'multiple':
                const userArr = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
                const correctArr = JSON.parse(correctAnswer).sort();
                isCorrect = JSON.stringify(userArr) === JSON.stringify(correctArr);
                break;
            case 'true_false':
                isCorrect = String(userAnswer).toLowerCase() === String(correctAnswer).toLowerCase();
                break;
        }

        return {
            result: isCorrect ? 'right' : 'wrong',
            mark: isCorrect ? 100 : 0,
            remark: isCorrect ? '回答正确' : `回答错误，正确答案是: ${correctAnswer}`
        };
    }

    async importQuestionsFromExcel(filePath, subjectId, bankId) {
        if (!bankId) {
            throw new Error('必须提供题库ID (bankId)');
        }

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        let successCount = 0;
        let failCount = 0;

        for (const row of data) {
            try {
                const questionData = {
                    subject_id: subjectId,
                    bank_id: bankId,
                    question_type: this.mapType(row['题型']),
                    question_content: row['题干'],
                    options: this.parseOptions(row['选项']),
                    correct_answer: String(row['正确答案']),
                    explanation: row['解析'] || ''
                };

                await questionDB.createQuestion(questionData);
                successCount++;
            } catch (error) {
                logger.error('导入行失败:', error, row);
                failCount++;
            }
        }

        return { success: successCount, failed: failCount };
    }

    mapType(typeStr) {
        const mapping = {
            '单选题': 'single',
            '多选题': 'multiple',
            '判断题': 'true_false',
            '问答题': 'essay'
        };
        return mapping[typeStr] || 'single';
    }

    parseOptions(optionsStr) {
        if (!optionsStr) return null;
        try {
            return JSON.parse(optionsStr);
        } catch (e) {
            // Fallback for simple string formats if needed
            return optionsStr.split('\n').filter(s => s.trim());
        }
    }
}

module.exports = new QuestionService();
