const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userDB = require('../db/UserDB');
const Logger = require('../utils/logger');
const logger = new Logger('AuthService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

class AuthService {
    async register(userData) {
        const { username, password, realName, email, departmentId } = userData;
        
        const existingUser = await userDB.findByUsername(username);
        if (existingUser) {
            throw new Error('USER_EXISTS');
        }

        const password_hash = await bcrypt.hash(password, 10);
        const userId = await userDB.createUser({
            username,
            password_hash,
            real_name: realName,
            email,
            department_id: departmentId,
            role_id: 2 // Normal user by default
        });

        return { userId };
    }

    async login(username, password) {
        const user = await userDB.findByUsername(username);
        if (!user) {
            throw new Error('INVALID_CREDENTIALS');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('INVALID_CREDENTIALS');
        }

        const token = jwt.sign(
            { userId: user.user_id, username: user.user_name, roleId: user.role_id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { token, user: { id: user.user_id, username: user.user_name, realName: user.real_name } };
    }
}

module.exports = new AuthService();
