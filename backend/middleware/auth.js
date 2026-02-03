const jwt = require('jsonwebtoken');
const Logger = require('../utils/logger');

const logger = new Logger('AuthMiddleware');
const JWT_SECRET = process.env.JWT_SECRET || 'quiz_app_secret_key_2024';

const auth = (req, res, next) => {
    try {
        // 从请求头获取token
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            logger.warn('请求缺少Authorization头');
            return res.status(401).json({ 
                success: false, 
                message: '未提供认证token' 
            });
        }

        // 检查token格式 (Bearer <token>)
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            logger.warn('Authorization头格式错误');
            return res.status(401).json({ 
                success: false, 
                message: 'token格式错误' 
            });
        }

        // 验证token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 调试日志：输出解码后的 Token 内容
        logger.info(`Token 解码内容: ${JSON.stringify(decoded)}`);

        // 将用户信息添加到请求对象
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            roleId: decoded.roleId,
            roleCode: decoded.roleCode,
            departmentId: decoded.departmentId,
            permissions: decoded.permissions || []
        };

        // logger.info(`用户认证成功: ${decoded.username} (ID: ${decoded.userId}) - URL: ${req.originalUrl}`);
        next();
        
    } catch (error) {
        logger.error('Token验证失败:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'token已过期' 
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'token无效' 
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: '认证服务器错误' 
            });
        }
    }
};

// 检查权限的中间件工厂
const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: '未授权' });
        }

        const userPermissions = req.user.permissions || [];
        if (userPermissions.includes(requiredPermission) || userPermissions.includes('SUPER_ADMIN')) {
            return next();
        }

        logger.warn(`权限不足: 用户 ${req.user.username} (ID: ${req.user.userId}) 尝试访问 ${req.originalUrl}, 需要权限: ${requiredPermission}, 拥有权限: ${JSON.stringify(userPermissions)}`);
        return res.status(403).json({ 
            success: false, 
            message: '权限不足，无法执行此操作' 
        });
    };
};

module.exports = { auth, checkPermission };