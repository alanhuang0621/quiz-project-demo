const express = require('express');
const Logger = require('../utils/logger'); // 引入 Logger 类
const logger = new Logger('AuthRouter'); // 创建 logger 实例

module.exports = (authService) => {
    const router = express.Router();

    // 用户注册路由
    router.post('/register', async (req, res) => {
        logger.info(`AuthRouter /register received request. Body: ${JSON.stringify(req.body)}`);
        try {
            const { username, password, realName, email, departmentId } = req.body;
            const roleId = null; // 默认角色为空
            const newUser = await authService.register(username, password, realName, email, departmentId, roleId);
            logger.info(`User ${username} registered successfully via AuthRouter.`);
            res.status(201).json({ 
                success: true,
                message: '用户注册成功', 
                data: { user: newUser }
            });
        } catch (error) {
            logger.error(`AuthRouter /register failed for user ${req.body.username || 'unknown'}: ${error.message}`);
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    });

    // 用户登录路由
    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            const { user, token } = await authService.login(username, password);
            
            // 登录成功后检查并颁发徽章
            try {
                const BadgeService = require('../services/BadgeService');
                const badgeService = new BadgeService();
                const newBadges = await badgeService.checkAndAwardNewBadges(user.user_id);
                
                if (newBadges && newBadges.length > 0) {
                    logger.info(`用户 ${user.user_id} 登录时获得新徽章: ${newBadges.map(b => b.badge_name).join(', ')}`);
                }
                
                res.status(200).json({ 
                    success: true,
                    message: '登录成功', 
                    data: {
                        user, 
                        token,
                        newBadges: newBadges || []
                    }
                });
            } catch (badgeError) {
                logger.error(`用户 ${user.user_id} 登录时徽章检查失败:`, badgeError);
                // 徽章检查失败不影响登录，只记录错误
                res.status(200).json({ 
                    success: true,
                    message: '登录成功', 
                    data: { user, token }
                });
            }
        } catch (error) {
            res.status(401).json({ 
                success: false,
                message: error.message 
            });
        }
    });

    // 用户修改密码路由
    router.put('/change-password', async (req, res) => {
        try {
            const { userId, oldPassword, newPassword } = req.body;
            await authService.changePassword(userId, oldPassword, newPassword);
            res.status(200).json({ 
                success: true,
                message: '密码修改成功' 
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    });

    // 用户重置密码路由
    router.post('/reset-password', async (req, res) => {
        try {
            const { username, email, newPassword } = req.body;
            await authService.resetPassword(username, email, newPassword);
            res.status(200).json({ 
                success: true,
                message: '密码重置成功' 
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    });

    // 获取当前用户信息
    const { auth } = require('../middleware/auth');
    router.get('/me', auth, async (req, res) => {
        try {
            const userId = req.user.userId;
            const user = await authService.userService.getUserById(userId);
            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    message: '用户不存在' 
                });
            }
            // 不返回密码哈希
            const { password_hash, ...userInfo } = user;
            
            // 获取用户权限并添加到用户信息中
            const permissions = await authService.permissionDB.getPermissionsByUserId(userId);
            userInfo.permissions = permissions;

            res.status(200).json({ 
                success: true,
                data: userInfo 
            });
        } catch (error) {
            logger.error(`获取当前用户信息失败: ${error.message}`);
            res.status(500).json({ 
                success: false,
                message: '获取用户信息失败' 
            });
        }
    });

    // 用户通过旧密码重置密码路由 (用于未登录状态下知道旧密码改新密码)
    router.put('/reset-password-by-username', async (req, res) => {
        try {
            const { username, oldPassword, newPassword } = req.body;
            await authService.resetPasswordByUsername(username, oldPassword, newPassword);
            res.status(200).json({ 
                success: true,
                message: '密码重置成功' 
            });
        } catch (error) {
            res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
    });

    return router;
};