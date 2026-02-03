const express = require('express');
const { auth, checkPermission } = require('../middleware/auth');
const Logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置 multer 用于文件上传
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

module.exports = (questionService, userAnswerHistoryService, userAnswerProgressService, experienceService, questionsTodayService, badgeService, userService, questionBankService) => {
    const router = express.Router();
    const logger = new Logger('QuestionRouter');

    // 添加问题
    router.post('/', auth, checkPermission('QUESTION_MANAGE'), async (req, res) => {
        try {
            const { subject_id, question_type, question_content, options, correct_answer, explanation, bank_id } = req.body;

            if (!question_type) {
                return res.status(400).json({ success: false, message: '题目类型不能为空' });
            }

            const result = await questionService.addQuestion(subject_id, question_type, question_content, options, correct_answer, explanation, bank_id);
            res.status(201).json({ 
                success: true,
                data: { question_id: result.question_id },
                message: '问题添加成功' 
            });
        } catch (error) {
            logger.error('添加问题失败:', error);
            res.status(500).json({ 
                success: false,
                message: '添加问题失败', 
                error: error.message 
            });
        }
    });

    // 批量导入题目
    router.post('/import', auth, checkPermission('QUESTION_MANAGE'), upload.single('file'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: '请选择要上传的文件' });
            }
            const { subject_id, bank_id } = req.body;
            
            logger.info(`QuestionRouter - Received import request: subject_id=${subject_id}, bank_id=${bank_id}`);
            
            if (!subject_id) {
                if (req.file && req.file.path) fs.unlinkSync(req.file.path);
                return res.status(400).json({ success: false, message: '请选择所属学科' });
            }

            const results = await questionService.importQuestionsFromExcel(req.file.path, parseInt(subject_id), bank_id);
            logger.info(`QuestionRouter - Import finished: success=${results.success}, failed=${results.failed}, questionIdsCount=${results.questionIds?.length}`);
            
            res.status(200).json({
                success: true,
                message: `成功导入 ${results.success} 题，失败 ${results.failed} 题`,
                data: results
            });
        } catch (error) {
            logger.error('导入题目失败:', error);
            res.status(500).json({ success: false, message: '导入题目失败', error: error.message });
        }
    });

    // 获取问题列表 (可按学科ID和问题类型筛选)
    router.get('/', auth, async (req, res) => {
        try {
            const { subjectId, questionType, keyword } = req.query;
            const questions = await questionService.getQuestions(subjectId, questionType, keyword);
            res.status(200).json({
                success: true,
                data: questions,
                message: '获取问题列表成功'
            });
        } catch (error) {
            console.error('获取问题列表失败:', error);
            res.status(500).json({ 
                success: false,
                message: '获取问题列表失败', 
                error: error.message 
            });
        }
    });

    // 获取已删除的问题列表 (必须在 /:questionId 路由之前)
    router.get('/deleted', auth, checkPermission('QUESTION_MANAGE'), async (req, res) => {
        try {
            const { subjectId } = req.query;
            const deletedQuestions = await questionService.getDeletedQuestions(subjectId);
            res.status(200).json({
                success: true,
                data: deletedQuestions,
                message: '获取已删除问题列表成功'
            });
        } catch (error) {
            logger.error('获取已删除问题列表失败:', error);
            res.status(500).json({ 
                success: false,
                message: '获取已删除问题列表失败', 
                error: error.message 
            });
        }
    });

    // 获取用户错题库
    router.get('/wrong', auth, async (req, res) => {
        try {
            const userId = req.user.userId; // 从认证中间件获取用户ID
            const { subjectId } = req.query;
            
            logger.info(`Getting wrong questions for user ${userId}, subject ${subjectId}`);
            
            const wrongQuestions = await questionService.getUserWrongQuestions(userId, subjectId);
            res.status(200).json({
                success: true,
                data: wrongQuestions,
                message: '获取错题库成功'
            });
        } catch (error) {
            logger.error('获取错题库失败:', error);
            res.status(500).json({ 
                success: false,
                message: '获取错题库失败', 
                error: error.message 
            });
        }
    });

    // 获取顺序题库数量
    router.get('/count', auth, async (req, res) => {
        try {
            const { subjectId } = req.query;
            
            logger.info(`Getting questions count for subject ${subjectId}`);
            
            const count = await questionService.getQuestionsCount(subjectId);
            res.status(200).json({ 
                success: true,
                data: { count },
                message: '获取题库数量成功'
            });
        } catch (error) {
            logger.error('获取题库数量失败:', error);
            res.status(500).json({ 
                success: false,
                message: '获取题库数量失败', 
                error: error.message 
            });
        }
    });

    // 获取用户错题库数量
    router.get('/wrong/count', auth, async (req, res) => {
        try {
            const userId = req.user.userId; // 从认证中间件获取用户ID
            const { subjectId } = req.query;
            
            logger.info(`Getting wrong questions count for user ${userId}, subject ${subjectId}`);
            
            const count = await questionService.getUserWrongQuestionsCount(userId, subjectId);
            res.status(200).json({ 
                success: true,
                data: { count },
                message: '获取错题库数量成功'
            });
        } catch (error) {
            logger.error('获取错题库数量失败:', error);
            res.status(500).json({ 
                success: false,
                message: '获取错题库数量失败', 
                error: error.message 
            });
        }
    });

    // 提交答案并判题
    router.post('/answer', auth, async (req, res, next) => {
        logger.info('Received answer submission request.', { body: req.body });
        try {
            const userId = req.user.userId; // 从认证中间件获取用户ID
            const { questionId, userAnswer, libraryType, taskId } = req.body;
            if (!questionId || userAnswer === undefined || userAnswer === null) {
                logger.warn('Missing required parameters for answer submission.', { userId, questionId, userAnswer });
                return res.status(400).json({ message: '缺少必要参数：questionId, userAnswer' });
            }

            // 判题
            const result = await questionService.checkAnswer(userId, questionId, userAnswer);
            logger.info('Result from questionService.checkAnswer:', result);
            
            // 保存答题记录和更新进度
            let userAnswerStr;
            if (Array.isArray(userAnswer)) {
                userAnswerStr = JSON.stringify(userAnswer);
            } else if (typeof userAnswer === 'boolean') {
                userAnswerStr = userAnswer.toString();
            } else {
                userAnswerStr = String(userAnswer);
            }
            
            // 提取AI评分和评语
            const aiMark = result.mark !== undefined ? result.mark : null;
            let aiRemark = result.remark !== undefined ? result.remark : null;
            const aiModel = result.aiModel;
            const aiKeyHint = result.aiKeyHint;
            
            // 构造持久化存储的评语（包含模型和 Key 信息）
            let storageRemark = aiRemark;
            if (aiModel) {
                // 统一顺序：【模型: ...】【Key: ...】评语
                storageRemark = `【模型: ${aiModel}】${aiKeyHint ? `【Key: ${aiKeyHint}】` : ''}${storageRemark || ''}`;
            }
            
            logger.info('QuestionRouter - 提取的AI数据:', {
                'result.mark': result.mark,
                'result.remark': result.remark,
                'aiMark': aiMark,
                'aiRemark': aiRemark,
                'aiModel': aiModel,
                'aiKeyHint': aiKeyHint,
                'taskId': taskId
            });
            
            // 只有在daily_test模式下才填入taskId，其他模式下taskId应为null
            const finalTaskId = (libraryType === 'daily_test') ? taskId : null;
            
            const historyId = await userAnswerHistoryService.addUserAnswerHistoryReturningId(userId, questionId, userAnswerStr, result.isCorrect, libraryType, aiMark, storageRemark, finalTaskId);
            const progressId = await userAnswerProgressService.upsertUserAnswerProgress(userId, questionId, userAnswerStr, result.isCorrect, libraryType, aiMark, storageRemark, finalTaskId);
            
            // 更新用户答题统计 (total_questions, correct_questions)
            try {
                if (userService) {
                    await userService.updateAnswerStats(userId, result.isCorrect);
                    logger.info('QuestionRouter - 用户统计更新成功');
                }
            } catch (statsError) {
                logger.error('更新用户统计失败:', statsError);
            }

            logger.info('QuestionRouter - 保存结果:', {
                'historyId': historyId,
                'progressId': progressId
            });

            // 如果是今日测验模式，同时更新questions_today表
            if (libraryType === 'daily_test' && taskId) {
                try {
                    // 查找对应的questions_today记录
                    const questionsTodayRecord = await questionsTodayService.getQuestionTodayByUserAndQuestion(userId, questionId, taskId);
                    
                    if (questionsTodayRecord && questionsTodayRecord.length > 0) {
                        const questionsTodayId = questionsTodayRecord[0].questions_today_id;
                        
                        // 更新questions_today表
                        await questionsTodayService.updateQuestionTodayAnswer(
                            questionsTodayId,
                            userAnswerStr,
                            result.isCorrect,
                            aiMark,
                            aiRemark
                        );
                        
                        logger.info('QuestionRouter - 已更新questions_today表:', {
                            'questionsTodayId': questionsTodayId,
                            'userId': userId,
                            'questionId': questionId,
                            'isCorrect': result.isCorrect
                        });
                    } else {
                        logger.warn('QuestionRouter - 未找到对应的questions_today记录:', {
                            'userId': userId,
                            'questionId': questionId,
                            'taskId': taskId
                        });
                    }
                } catch (todayError) {
                    logger.error('更新questions_today表失败:', todayError);
                    // 不影响主要答题流程，继续执行
                }
            }

            // 经验和积分奖励
            let rewardInfo = null;
            try {
                if (experienceService) {
                    // 基本奖励类型
                    let rewardType = result.isCorrect ? 'ANSWER_CORRECT' : 'ANSWER_WRONG';
                    
                    // 问答题优秀奖励 (AI评分 >= 80)
                    if (result.isCorrect && aiMark >= 80) {
                        rewardType = 'ESSAY_EXCELLENT';
                    }

                    rewardInfo = await experienceService.addRewards(userId, rewardType, questionId);
                    logger.info(`QuestionRouter - 奖励发放成功: ${rewardType}`, rewardInfo);
                }
            } catch (expError) {
                logger.error('添加奖励失败:', expError);
                // 奖励添加失败不影响答题流程，继续执行
            }
            
            const { isCorrect, remark, mark, aiModel: resultAiModel, aiKeyHint: resultAiKeyHint } = result;
            
            // 响应
            const resp = { isCorrect, historyId, progressId };
            if (typeof remark !== 'undefined') resp.remark = remark;
            if (typeof mark !== 'undefined') resp.mark = mark;
            if (typeof resultAiModel !== 'undefined') resp.aiModel = resultAiModel;
            if (typeof resultAiKeyHint !== 'undefined') resp.aiKeyHint = resultAiKeyHint;
            
            // 添加奖励信息到响应中
            if (rewardInfo) {
                resp.rewardInfo = rewardInfo;
            }
            
            // 检查并颁发新徽章
            let badgeResult = null;
            try {
                if (badgeService) {
                    const newBadges = await badgeService.checkAndAwardNewBadges(userId);
                    if (newBadges && newBadges.length > 0) {
                        badgeResult = {
                            newBadges: newBadges,
                            count: newBadges.length
                        };
                        
                        logger.info('QuestionRouter - 用户获得新徽章:', {
                            'userId': userId,
                            'newBadgesCount': newBadges.length,
                            'newBadges': newBadges.map(b => ({ id: b.badge_id, name: b.badge_name }))
                        });
                    }
                }
            } catch (badgeError) {
                logger.error('检查新徽章失败:', badgeError);
                // 徽章检查失败不影响答题流程，继续执行
            }
            
            // 添加徽章信息到响应中
            if (badgeResult) {
                resp.badges = badgeResult;
            }
            
            return res.status(200).json({
                success: true,
                data: resp,
                message: '提交答案成功'
            });
        } catch (error) {
            logger.error('提交答案失败:', error);
            res.status(500).json({ 
                success: false,
                message: '提交答案失败', 
                error: error.message 
            });
        }
    });

    // 更新问题
    router.put('/:questionId', auth, checkPermission('QUESTION_MANAGE'), async (req, res) => {
        try {
            const { questionId } = req.params;
            const { subject_id, question_type, question_content, correct_answer, explanation, options } = req.body;
            
            const updates = {};
            if (subject_id !== undefined) updates.subject_id = subject_id;
            if (question_type !== undefined) updates.question_type = question_type;
            if (question_content !== undefined) updates.question_content = question_content;
            if (correct_answer !== undefined) updates.correct_answer = correct_answer;
            if (explanation !== undefined) updates.explanation = explanation;
            if (options !== undefined) updates.options = options;
            
            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: '没有提供更新内容' 
                });
            }

            const success = await questionService.updateQuestion(questionId, updates);
            if (success) {
                res.status(200).json({ 
                    success: true,
                    message: '问题更新成功' 
                });
            } else {
                res.status(404).json({ 
                    success: false,
                    message: '问题未找到或无更新' 
                });
            }
        } catch (error) {
            console.error('更新问题失败:', error);
            res.status(500).json({ 
                success: false,
                message: '更新问题失败', 
                error: error.message 
            });
        }
    });

    // 软删除所有问题
    router.delete('/', auth, checkPermission('QUESTION_MANAGE_ALL'), async (req, res) => {
        try {
            const count = await questionService.deleteAllQuestions();
            res.status(200).json({ 
                success: true,
                message: `成功软删除 ${count} 道题目` 
            });
        } catch (error) {
            logger.error('软删除所有问题失败:', error);
            res.status(500).json({ 
                success: false,
                message: '软删除所有问题失败', 
                error: error.message 
            });
        }
    });

    // 硬删除（清空）所有题目及关联数据 (管理员功能)
    router.delete('/all/truncate', auth, checkPermission('QUESTION_MANAGE_ALL'), async (req, res) => {
        try {
            const count = await questionService.clearAllQuestions();
            res.status(200).json({ 
                success: true, 
                message: `成功清空题库，共删除 ${count} 道题目及其关联记录` 
            });
        } catch (error) {
            logger.error('清空题库失败:', error);
            res.status(500).json({ 
                success: false, 
                message: '清空题库失败', 
                error: error.message 
            });
        }
    });

    // 删除问题（软删除）
    router.delete('/:questionId', auth, checkPermission('QUESTION_MANAGE'), async (req, res) => {
        try {
            const { questionId } = req.params;
            const success = await questionService.deleteQuestion(questionId);
            if (success) {
                res.status(200).json({ 
                    success: true,
                    message: '问题删除成功' 
                });
            } else {
                res.status(404).json({ 
                    success: false,
                    message: '问题未找到' 
                });
            }
        } catch (error) {
            console.error('删除问题失败:', error);
            res.status(500).json({ 
                success: false,
                message: '删除问题失败', 
                error: error.message 
            });
        }
    });

    // 恢复删除的问题
    router.put('/:questionId/restore', auth, checkPermission('QUESTION_MANAGE'), async (req, res) => {
        try {
            const { questionId } = req.params;
            const success = await questionService.restoreQuestion(questionId);
            if (success) {
                res.status(200).json({ 
                    success: true,
                    message: '问题恢复成功' 
                });
            } else {
                res.status(404).json({ 
                    success: false,
                    message: '问题未找到' 
                });
            }
        } catch (error) {
            console.error('恢复问题失败:', error);
            res.status(500).json({ 
                success: false,
                message: '恢复问题失败', 
                error: error.message 
            });
        }
    });

    return router;
};