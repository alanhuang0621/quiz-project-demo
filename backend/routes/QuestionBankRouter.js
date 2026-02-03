module.exports = (questionBankService, practiceService) => {
    const express = require('express');
    const router = express.Router();
    const { auth, checkPermission } = require('../middleware/auth');

    // 智能测验题目生成 (智能练习)
    router.post('/generate', auth, async (req, res) => {
        const userId = req.user.userId;
        const { bankIds, mode, limit, subjectId } = req.body;
        console.log('POST /api/banks/generate called for user:', userId, 'banks:', bankIds, 'subjectId:', subjectId);
        try {
            const questions = await practiceService.generateQuestions(userId, bankIds, limit || 20, mode || 'practice', subjectId);
            res.status(200).json({
                success: true,
                message: '生成智能测验题目成功',
                data: questions
            });
        } catch (error) {
            console.error('生成智能测验题目失败:', error);
            res.status(500).json({ success: false, message: '生成题目失败' });
        }
    });

    // 获取题库列表（支持按学科筛选）
    router.get('/', auth, async (req, res) => {
        let { subjectId } = req.query;
        const userId = req.user.userId;
        console.log('GET /api/banks called with subjectId:', subjectId, 'type:', typeof subjectId);
        
        try {
            let banks;
            // 校验 subjectId 是否有效
            // 处理字符串 "null", "undefined", "" 等情况
            if (subjectId !== undefined && subjectId !== null && subjectId !== 'undefined' && subjectId !== 'null' && subjectId !== '') {
                const sid = parseInt(subjectId);
                if (!isNaN(sid)) {
                    console.log(`Fetching banks for subjectId: ${sid}`);
                    banks = await questionBankService.getBanksBySubject(sid, userId);
                } else {
                    console.warn(`Invalid subjectId received: ${subjectId}, falling back to all banks`);
                    banks = await questionBankService.getAllBanks();
                }
            } else {
                // 如果没有提供 subjectId，或者 subjectId 为空，返回所有题库
                console.log('No subjectId provided or null/empty, fetching all banks');
                banks = await questionBankService.getAllBanks();
            }
            
            // 确保返回的是数组
            if (!Array.isArray(banks)) {
                console.error('Service did not return an array for banks:', banks);
                banks = [];
            }
            
            console.log(`Successfully fetched ${banks.length} banks`);
            res.status(200).json({
                success: true,
                message: '获取题库列表成功',
                data: banks
            });
        } catch (error) {
            console.error('获取题库列表失败:', error);
            res.status(500).json({ success: false, message: '获取题库列表失败', error: error.message });
        }
    });

    // 获取所有题库
    router.get('/all', auth, async (req, res) => {
        console.log('GET /api/banks/all called');
        try {
            const banks = await questionBankService.getAllBanks();
            console.log(`Successfully fetched ${banks.length} banks`);
            res.json({ success: true, data: banks });
        } catch (error) {
            console.error('获取题库列表失败:', error);
            res.status(500).json({ success: false, message: '获取题库列表失败' });
        }
    });

    // 创建新题库
    router.post('/', auth, checkPermission('QUESTION_MANAGE'), async (req, res) => {
        try {
            const result = await questionBankService.createBank(req.body);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('创建题库失败:', error);
            res.status(500).json({ success: false, message: '创建题库失败' });
        }
    });

    // 更新题库
    router.put('/:id', auth, checkPermission('QUESTION_MANAGE'), async (req, res) => {
        try {
            const result = await questionBankService.updateBank(req.params.id, req.body);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('更新题库失败:', error);
            res.status(500).json({ success: false, message: '更新题库失败' });
        }
    });

    // 删除题库
    router.delete('/:id', auth, checkPermission('QUESTION_MANAGE'), async (req, res) => {
        try {
            const result = await questionBankService.deleteBank(req.params.id);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('删除题库失败:', error);
            res.status(500).json({ success: false, message: '删除题库失败' });
        }
    });

    // 获取题库中的题目
    router.get('/:id/questions', auth, async (req, res) => {
        try {
            const questions = await questionBankService.getBankQuestions(req.params.id);
            res.json({ success: true, data: questions });
        } catch (error) {
            console.error('获取题库题目失败:', error);
            res.status(500).json({ success: false, message: '获取题库题目失败' });
        }
    });

    // 向题库添加题目
    router.post('/:id/questions', auth, checkPermission('QUESTION_MANAGE'), async (req, res) => {
        try {
            const { questionId } = req.body;
            const result = await questionBankService.addQuestionToBank(req.params.id, questionId);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('添加题目到题库失败:', error);
            res.status(500).json({ success: false, message: '添加题目到题库失败' });
        }
    });

    // 从题库移除题目
    router.delete('/:id/questions/:questionId', auth, checkPermission('QUESTION_MANAGE'), async (req, res) => {
        try {
            const result = await questionBankService.removeQuestionFromBank(req.params.id, req.params.questionId);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('从题库移除题目失败:', error);
            res.status(500).json({ success: false, message: '从题库移除题目失败' });
        }
    });

    return router;
};