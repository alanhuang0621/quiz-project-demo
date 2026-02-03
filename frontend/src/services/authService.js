import apiClient from './apiClient';

const authService = {
    async login(username, password) {
        const response = await apiClient.post('/auth/login', { username, password });
        if (response.success && response.data.token) {
            localStorage.setItem('authToken', response.data.token);
        }
        return response.data;
    },

    async register(userData) {
        return await apiClient.post('/auth/register', userData);
    },

    logout() {
        localStorage.removeItem('authToken');
    },

    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }
};

export default authService;
