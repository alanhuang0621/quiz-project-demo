import apiClient from './apiClient';

const userService = {
    async getProfile() {
        return await apiClient.get('/users/profile');
    },

    async getRankings() {
        return await apiClient.get('/users/rankings');
    }
};

export default userService;
