const express = require('express');
const { auth, checkPermission } = require('../middleware/auth');

module.exports = (userService, experienceService) => {
    const router = express.Router();

    // 获取用户经验等级信息
    router.get('/experience', auth, async (req, res) => {
        try {
            const userId = req.user.userId;
            const levelInfo = await experienceService.getUserLevelInfo(userId);
            res.status(200).json({
                success: true,
                data: levelInfo,
                message: '获取用户等级信息成功'
            });
        } catch (err) {
            console.error('Error getting user experience:', err);
            res.status(500).json({ 
                success: false,
                message: '获取用户等级信息失败' 
            });
        }
    });

    // 获取所有可用权限列表
    router.get('/permissions', auth, async (req, res) => {
        try {
            const permissions = await userService.getAllPermissions();
            res.status(200).json({ 
                success: true,
                data: { permissions },
                message: '获取权限列表成功'
            });
        } catch (err) {
            console.error('Error getting permissions:', err);
            res.status(500).json({ 
                success: false,
                message: '获取权限列表失败' 
            });
        }
    });

    // 获取特定用户的详细权限设置 (包括角色继承和显式覆盖)
    router.get('/:userId/permissions', auth, async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            const detail = await userService.getUserPermissionsDetail(userId);
            res.status(200).json({
                success: true,
                data: detail,
                message: '获取用户权限成功'
            });
        } catch (err) {
            console.error('Error getting user permissions:', err);
            res.status(500).json({ 
                success: false,
                message: '获取用户权限失败' 
            });
        }
    });

    // 为用户分配权限 (显式覆盖)
    router.put('/:userId/permissions', auth, async (req, res) => {
        try {
            // 权限检查
            const hasPermission = req.user.permissions && (req.user.permissions.includes('SUPER_ADMIN') || req.user.permissions.includes('USER_MANAGE_ALL') || req.user.permissions.includes('USER_MANAGE'));
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足，无法分配权限'
                });
            }

            const { userId } = req.params;
            const { permissions } = req.body;
            await userService.updateUserPermissions(userId, permissions);
            res.status(200).json({ 
                success: true,
                message: '用户权限更新成功' 
            });
        } catch (err) {
            console.error('Error updating user permissions:', err);
            res.status(500).json({ 
                success: false,
                message: '更新权限失败: ' + err.message 
            });
        }
    });

    // 获取用户信息 - 需要认证
    router.get('/profile', auth, async (req, res) => {
        try {
            const userId = req.user.userId;
            const user = await userService.getUserById(userId);
            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    message: '用户不存在' 
                });
            }

            // 获取用户权限
            const permissions = await userService.permissionDB.getPermissionsByUserId(userId);

            // 不返回密码哈希
            const { password_hash, ...userInfo } = user;
            // 将权限包含在用户信息中
            userInfo.permissions = permissions;

            res.status(200).json({ 
                success: true,
                data: userInfo,
                message: '获取用户信息成功'
            });
        } catch (err) {
            console.error('Error getting user profile:', err);
            res.status(500).json({ 
                success: false,
                message: '获取用户信息失败' 
            });
        }
    });

    // 获取待审批用户
    router.get('/pending', auth, async (req, res) => {
        try {
            if (!req.user) {
                console.error('[UserRouter] req.user 为空!');
                return res.status(401).json({ success: false, message: '未授权' });
            }
            // 权限检查
            const hasPermission = req.user.permissions && (req.user.permissions.includes('SUPER_ADMIN') || req.user.permissions.includes('USER_MANAGE_ALL') || req.user.permissions.includes('USER_MANAGE'));
            
            if (!hasPermission) {
                console.warn(`[UserRouter] 权限拒绝 (pending): 用户=${req.user.username}, permissions=${JSON.stringify(req.user.permissions)}`);
                return res.status(403).json({
                    success: false,
                    message: '权限不足，无法访问待审批用户列表'
                });
            }

            const users = await userService.getPendingUsers(req.user);
            res.status(200).json({ 
                success: true,
                data: { users },
                message: '获取待审批用户成功'
            });
        } catch (err) {
            console.error('Error getting pending users:', err);
            res.status(500).json({ 
                success: false,
                message: '获取待审批用户失败' 
            });
        }
    });

    // 审批用户
    router.post('/:userId/approve', auth, async (req, res) => {
        try {
            // 权限检查
            const hasPermission = req.user.permissions && (req.user.permissions.includes('SUPER_ADMIN') || req.user.permissions.includes('USER_MANAGE_ALL') || req.user.permissions.includes('USER_MANAGE'));
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足，无法执行审批操作'
                });
            }

            const { userId } = req.params;
            const { status, roleId } = req.body; // status: 'approved' or 'rejected'
            
            const result = await userService.approveUser(userId, status, roleId);
            res.status(200).json({ 
                success: true,
                data: result,
                message: status === 'approved' ? '用户已批准' : '用户已拒绝'
            });
        } catch (err) {
            console.error('Error approving user:', err);
            res.status(500).json({ 
                success: false,
                message: '操作失败: ' + err.message 
            });
        }
    });

    // 获取所有用户列表 (管理员权限)
    router.get('/all', auth, async (req, res) => {
        try {
            if (!req.user) {
                console.error('[UserRouter] req.user 为空!');
                return res.status(401).json({ success: false, message: '未授权' });
            }
            // 权限检查
            const hasPermission = req.user.permissions && (req.user.permissions.includes('SUPER_ADMIN') || req.user.permissions.includes('USER_MANAGE_ALL') || req.user.permissions.includes('USER_MANAGE'));
            
            if (!hasPermission) {
                console.warn(`[UserRouter] 权限拒绝 (all): 用户=${req.user.username}, permissions=${JSON.stringify(req.user.permissions)}`);
                return res.status(403).json({
                    success: false,
                    message: '权限不足，无法访问用户列表'
                });
            }

            // UserService.js 中实际的方法名是 getUsers
            const users = await userService.getUsers(req.user);
            res.status(200).json({ 
                success: true,
                data: users,
                message: '获取用户列表成功'
            });
        } catch (err) {
            console.error('Error getting all users:', err);
            res.status(500).json({ 
                success: false,
                message: '获取用户列表失败' 
            });
        }
    });

    // 管理员或部门负责人删除用户
    router.delete('/:userId', auth, async (req, res) => {
        try {
            // 权限检查
            const hasPermission = req.user.permissions && (req.user.permissions.includes('SUPER_ADMIN') || req.user.permissions.includes('USER_MANAGE_ALL') || req.user.permissions.includes('USER_MANAGE'));
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足，无法删除用户'
                });
            }

            const targetUserId = parseInt(req.params.userId);
            await userService.deleteUser(targetUserId, req.user);
            res.status(200).json({ 
                success: true, 
                message: '用户已删除' 
            });
        } catch (err) {
            console.error('Error deleting user:', err);
            res.status(err.message === '用户不存在' ? 404 : 403).json({ 
                success: false,
                message: err.message || '删除失败' 
            });
        }
    });

    // 更新用户信息 (管理员或本人)
    router.put('/:userId', auth, async (req, res) => {
        try {
            const targetUserId = parseInt(req.params.userId);
            const userData = req.body;
            
            // 权限检查：只能修改自己的信息，或者是管理员
            const hasAdminPermission = req.user.permissions && (req.user.permissions.includes('SUPER_ADMIN') || req.user.permissions.includes('USER_MANAGE_ALL') || req.user.permissions.includes('USER_MANAGE'));
            if (targetUserId !== req.user.userId && !hasAdminPermission) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足，无法修改他人信息'
                });
            }

            const result = await userService.updateUser(targetUserId, userData, req.user);
            res.status(200).json({ 
                success: true, 
                data: result,
                message: '用户信息已更新' 
            });
        } catch (err) {
            console.error('Error updating user:', err);
            res.status(err.message === '用户不存在' ? 404 : 403).json({ 
                success: false,
                message: err.message || '修改失败' 
            });
        }
    });

    // 获取同部门等级排名
    router.get('/department-ranking', auth, async (req, res) => {
        try {
            const userId = req.user.userId;
            const ranking = await userService.getDepartmentRanking(userId);
            res.status(200).json({
                success: true,
                data: ranking,
                message: '获取部门排名成功'
            });
        } catch (err) {
            console.error('Error getting department ranking:', err);
            res.status(500).json({ 
                success: false,
                message: '获取部门排名失败' 
            });
        }
    });

    // 获取部门排名列表 (兼容 getDepartmentRankingList)
    router.get('/department-ranking-list', auth, async (req, res) => {
        try {
            const userId = req.user.userId;
            const ranking = await userService.getDepartmentRanking(userId);
            res.status(200).json({
                success: true,
                data: ranking,
                message: '获取部门排名列表成功'
            });
        } catch (err) {
            console.error('Error getting department ranking list:', err);
            res.status(500).json({ 
                success: false,
                message: '获取部门排名列表失败' 
            });
        }
    });

    return router;
};