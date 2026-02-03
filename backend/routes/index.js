const express = require('express');
const authRouter = require('./AuthRouter'); // 更新引用路径
const userRouter = require('./UserRouter');
const userAnswerHistoryRouter = require('./UserAnswerHistoryRouter');
const questionsTodayRouter = require('./QuestionsTodayRouter');
const questionsTodayTaskRouter = require('./QuestionsTodayTaskRouter');
const examRouter = require('./ExamRouter');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/answer-history', userAnswerHistoryRouter);
router.use('/questions-today', questionsTodayRouter);
router.use('/questions-today-task', questionsTodayTaskRouter);
router.use('/exam', examRouter);

module.exports = router;