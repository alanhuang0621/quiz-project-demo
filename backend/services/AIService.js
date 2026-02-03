const axios = require('axios');
const Logger = require('../utils/logger');
const logger = new Logger('AIService');

class AIService {
    constructor() {
        this.apiKey = 'b8bc1a2a0bac4ba5bb5bf0262670bf09.ylJ3W3YugMkTmlv2';
        this.apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    }

    async gradeAnswer(question, userAnswer, correctAnswer) {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const prompt = `你是一个专业的批改老师，请根据以下题目、用户答案和正确答案，给出批改结果。
请严格按照 JSON 格式返回，包含以下属性：
- result: 批改结果，只能是 "right" 或 "wrong"。
- mark: 批改得分，0-100分。
- remark: 批改意见，说明为什么对或为什么错。
请确保 result 和 mark 严格一致：
- 如果 mark >= 60 且 result 为 "right"，则认为用户答案正确。
- 如果 mark < 60 且 result 为 "wrong"，则认为用户答案错误。
- 如果 result 和 mark 不匹配（例如 result 为 "wrong" 但 mark >= 60），请重新判断，直到匹配为止。
- 如果尝试 3 次后仍不匹配，请将 result 设为 "right"，remark 设为 "AI 未能成功判断对错。"

题目: ${question}
用户答案: ${userAnswer}
正确答案: ${correctAnswer}

示例：
{
  "result": "right",
  "mark": 85,
  "remark": "用户答案完全正确，与标准答案一致。"
}`;

                const response = await axios.post(this.apiUrl, {
                    model: 'glm-4-flash',
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: 'json_object' }
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = JSON.parse(response.data.choices[0].message.content);
                
                // Validate result and mark consistency
                const isConsistent = (result.mark >= 60 && result.result === 'right') || 
                                   (result.mark < 60 && result.result === 'wrong');

                if (isConsistent) {
                    return result;
                }

                attempts++;
                logger.warn(`AI result inconsistent, retrying... (Attempt ${attempts})`);
            } catch (error) {
                logger.error('AI批改失败:', error);
                attempts++;
            }
        }

        return {
            result: 'right',
            mark: 0,
            remark: 'AI 未能成功判断对错。'
        };
    }
}

module.exports = new AIService();
