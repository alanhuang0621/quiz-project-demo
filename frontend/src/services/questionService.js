import apiClient from './apiClient';

const questionService = {
    async getAllQuestions() {
        return await apiClient.get('/questions');
    },

    async getQuestionsBySubject(subjectId) {
        return await apiClient.get(`/questions/subject/${subjectId}`);
    },

    async createQuestion(data) {
        return await apiClient.post('/questions', data);
    },

    async updateQuestion(id, data) {
        return await apiClient.put(`/questions/${id}`, data);
    },

    async deleteQuestion(id) {
        return await apiClient.delete(`/questions/${id}`);
    },

    async checkAnswer(questionId, userAnswer) {
        return await apiClient.post('/questions/check', { questionId, userAnswer });
    }
};

export default questionService;
