require('dotenv').config();

const config = {
    user: 'sa',
    password: '123456',
    server: 'DESKTOP-IAURSFU\\THRenliMS', // Updated as per user instruction
    database: 'quiz_db',
    pool: {
        max: 50,
        min: 10,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false, // For Azure SQL Database, set to true
        trustServerCertificate: true // Change to true for local dev / self-signed certs
    },
    frontendUrl: process.env.FRONTEND_URL
};

module.exports = config;