const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Logger = require('./utils/logger');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const config = require('./config/config');
const { getConnection } = require('./db/db_connect');
const SubjectDB = require('./db/SubjectDB');
const QuestionDB = require('./db/QuestionDB');
const UserDB = require('./db/UserDB');
const FavoriteDB = require('./db/FavoriteDB');
const WrongDB = require('./db/WrongDB');
const UserAnswerProgressDB = require('./db/UserAnswerProgressDB');
const UserAnswerHistoryDB = require('./db/UserAnswerHistoryDB');
const DepartmentDB = require('./db/DepartmentDB');
const RoleDB = require('./db/RoleDB');
const QuestionsTodayDB = require('./db/QuestionsTodayDB');
const QuestionsTodayTaskDB = require('./db/QuestionsTodayTaskDB');
const BadgeDB = require('./db/BadgeDB');
const PermissionDB = require('./db/PermissionDB');
const ShopDB = require('./db/ShopDB');
const AiConfigDB = require('./db/AiConfigDB');

const SubjectService = require('./services/SubjectService');
const QuestionService = require('./services/QuestionService');
const UserService = require('./services/UserService');
const AuthService = require('./services/AuthService');
const FavoriteService = require('./services/FavoriteService');
const WrongService = require('./services/WrongService');
const UserAnswerProgressService = require('./services/UserAnswerProgressService');
const UserAnswerHistoryService = require('./services/UserAnswerHistoryService');
const DepartmentService = require('./services/DepartmentService');
const RoleService = require('./services/RoleService');
const AIService = require('./services/AIService');
const AIAnalysisService = require('./services/AIAnalysisService');
const ExperienceService = require('./services/ExperienceService');
const QuestionsTodayService = require('./services/QuestionsTodayService');
const QuestionsTodayTaskService = require('./services/QuestionsTodayTaskService');
const BadgeService = require('./services/BadgeService');
const ShopService = require('./services/ShopService');
const QuestionBankService = require('./services/QuestionBankService');
const PracticeService = require('./services/PracticeService');

const SubjectRouter = require('./routes/SubjectRouter');
const QuestionRouter = require('./routes/QuestionRouter');
const AuthRouter = require('./routes/AuthRouter');
const UserRouter = require('./routes/UserRouter');
const FavoriteRouter = require('./routes/FavoriteRouter');
const WrongRouter = require('./routes/WrongRouter');
const UserAnswerHistoryRouter = require('./routes/UserAnswerHistoryRouter');
const UserAnswerProgressRouter = require('./routes/UserAnswerProgressRouter');
const DepartmentRouter = require('./routes/DepartmentRouter');
const RoleRouter = require('./routes/RoleRouter');
const AnalysisRouter = require('./routes/AnalysisRouter');
const QuestionsTodayRouter = require('./routes/QuestionsTodayRouter');
const QuestionsTodayTaskRouter = require('./routes/QuestionsTodayTaskRouter');
const ExamRouter = require('./routes/ExamRouter');
const BadgeRouter = require('./routes/BadgeRouter');
const ShopRouter = require('./routes/ShopRouter');
const QuestionBankRouter = require('./routes/QuestionBankRouter');
const AiConfigRouter = require('./routes/AiConfigRouter');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Socket.io 处理
io.on('connection', (socket) => {
    const logger = new Logger('socket', 'debug');
    logger.info(`New client connected: ${socket.id}`);

    socket.on('join_user', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
            logger.info(`Socket ${socket.id} joined user_${userId} room`);
        }
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

async function startServer() {
    const logger = new Logger('server', 'debug');
    try {
        logger.info('Starting server...');

        // Database Connection (Mandatory)
        const db = await getConnection();
        logger.info('Database connected successfully.');

        // Initialize DB Layer
        const subjectDB = new SubjectDB(db, logger);
        const questionDB = new QuestionDB(db, logger);
        const userDB = new UserDB(db, logger);
        const favoriteDB = new FavoriteDB(db, logger);
        const wrongDB = new WrongDB(db, logger);
        const userAnswerProgressDB = new UserAnswerProgressDB(db, logger);
        const userAnswerHistoryDB = new UserAnswerHistoryDB(db, logger);
        const departmentDB = new DepartmentDB(db, logger);
        const roleDB = new RoleDB(db, logger);
        const questionsTodayDB = new QuestionsTodayDB(db, logger);
        const questionsTodayTaskDB = new QuestionsTodayTaskDB(db, logger);
        const badgeDB = new BadgeDB(db, logger);
        const permissionDB = new PermissionDB(db, logger);
        const shopDB = new ShopDB(db, logger);
        const aiConfigDB = new AiConfigDB(db);

        // 初始化 AI 配置表
        await aiConfigDB.createTables();

        // Initialize Services Layer
        const aiService = new AIService(aiConfigDB, logger);
        aiService.setIo(io); // 注入 Socket.io 实例
        const subjectService = new SubjectService(subjectDB, logger, questionDB);
        const wrongService = new WrongService(wrongDB, logger);
        const userAnswerProgressService = new UserAnswerProgressService(userAnswerProgressDB, logger);
        const userAnswerHistoryService = new UserAnswerHistoryService(userAnswerHistoryDB, logger);
        const experienceService = new ExperienceService(userDB);
        const userService = new UserService(userDB, logger, permissionDB);
        const badgeService = new BadgeService(badgeDB, userAnswerHistoryDB, logger);
        const questionsTodayService = new QuestionsTodayService(questionsTodayDB, logger);
        const questionsTodayTaskService = new QuestionsTodayTaskService(questionsTodayTaskDB, logger);

        const questionBankService = new QuestionBankService(db, logger);
        const aiAnalysisService = new AIAnalysisService(
            userAnswerHistoryDB, 
            questionDB, 
            subjectDB, 
            userDB, 
            questionsTodayTaskDB, 
            questionsTodayDB, 
            aiService,
            logger
        );
        const shopService = new ShopService(shopDB, userDB, logger);
        const practiceService = new PracticeService(db, logger);

        const questionService = new QuestionService(
            questionDB, 
            logger, 
            aiService, 
            wrongService, 
            userAnswerHistoryService, 
            userAnswerProgressService, 
            questionBankService,
            questionsTodayService,
            badgeService,
            userService,
            experienceService
        );
        
        const favoriteService = new FavoriteService(favoriteDB, logger);
        const departmentService = new DepartmentService(departmentDB, logger);
        const roleService = new RoleService(roleDB, logger, permissionDB);
        const authService = new AuthService(userService, roleService, permissionDB, experienceService, logger);

        // Middleware
        app.use(cors({
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);
                // 允许 localhost, 127.0.0.1 以及所有 IP 地址访问 (开发环境下)
                if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1|(\d{1,3}\.){3}\d{1,3}):\d+$/)) {
                    return callback(null, true);
                }
                callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        app.use(express.json());

        // Register Routes
        app.use('/api/subjects', SubjectRouter(subjectService));
        app.use('/api/questions', QuestionRouter(questionService, userAnswerHistoryService, userAnswerProgressService, experienceService, questionsTodayService, badgeService, userService, questionBankService));
        app.use('/api/auth', AuthRouter(authService));
        app.use('/api/users', UserRouter(userService, experienceService));
        app.use('/api/favorites', FavoriteRouter(favoriteService));
        app.use('/api/wrong', WrongRouter(wrongService));
        app.use('/api/progress', UserAnswerProgressRouter(userAnswerProgressService));
        app.use('/api/user-answer-history', UserAnswerHistoryRouter(userAnswerHistoryService));
        app.use('/api/departments', DepartmentRouter(departmentService));
        app.use('/api/roles', RoleRouter(roleService));
        app.use('/api/analysis', AnalysisRouter(aiAnalysisService));
        app.use('/api/questions-today', QuestionsTodayRouter(questionsTodayService));
        app.use('/api/questions-today-task', QuestionsTodayTaskRouter(questionsTodayTaskService));
        app.use('/api/exam', ExamRouter(questionsTodayService, questionService, questionsTodayTaskService, userAnswerProgressService, userAnswerHistoryService, aiService, logger, experienceService));
        app.use('/api/badges', BadgeRouter(badgeService));
        app.use('/api/shop', ShopRouter(shopService));
        app.use('/api/banks', QuestionBankRouter(questionBankService, practiceService));
        app.use('/api/ai-config', AiConfigRouter(aiConfigDB, aiService));

        app.use((req, res, next) => {
            const error = new Error(`Not Found - ${req.originalUrl}`);
            res.status(404);
            next(error);
        });

        app.use((error, req, res, next) => {
            const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
            res.status(statusCode);
            res.json({
                message: error.message,
                stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
            });
        });

        const PORT = process.env.PORT || 5000;
        httpServer.listen(PORT, '127.0.0.1', () => {
            logger.info(`Server running on port ${PORT}`);
        });

    } catch (error) {
        logger.error(`Server failed to start: ${error.message}`, error);
        process.exit(1);
    }
}

startServer();