const { getConnection, sql } = require('./backend/db/db_connect');
const bcrypt = require('bcryptjs');

async function populate() {
    try {
        const pool = await getConnection();
        
        console.log('Clearing old data...');
        // Order matters due to foreign keys
        await pool.request().query('DELETE FROM questions');
        await pool.request().query('DELETE FROM users');
        await pool.request().query('DELETE FROM department');
        await pool.request().query('DELETE FROM subjects');

        console.log('Inserting departments...');
        await pool.request().query("INSERT INTO department (department_name, is_deleted) VALUES ('研发部', 0), ('市场部', 0)");

        console.log('Inserting subjects...');
        await pool.request().query("INSERT INTO subjects (subject_name, subject_code) VALUES ('语文', 'CHINESE'), ('数学', 'MATH')");

        console.log('Inserting users...');
        const adminPass = await bcrypt.hash('admin123', 10);
        const userPass = await bcrypt.hash('123456', 10);
        
        await pool.request()
            .input('pass', sql.VarChar, adminPass)
            .query("INSERT INTO users (user_name, password_hash, real_name, email, department_id, role_id, is_deleted) VALUES ('admin', @pass, '管理员', 'admin@example.com', 1, 1, 0)");
            
        await pool.request()
            .input('pass', sql.VarChar, userPass)
            .query("INSERT INTO users (user_name, password_hash, real_name, email, department_id, role_id, is_deleted) VALUES ('testuser', @pass, '测试用户', 'test@example.com', 1, 2, 0)");

        console.log('Database populated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error populating database:', err);
        process.exit(1);
    }
}

populate();
