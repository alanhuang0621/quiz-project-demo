const fs = require('fs');
const path = require('path');

class Logger {
    constructor(context, level = 'info') {
        this.context = context;
        this.level = level;
        this.logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }
    }

    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        let formatted = `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`;
        if (data) {
            formatted += ` ${JSON.stringify(data)}`;
        }
        return formatted;
    }

    info(message, data) {
        const msg = this.formatMessage('info', message, data);
        console.log(msg);
        this.saveToFile(msg);
    }

    warn(message, data) {
        const msg = this.formatMessage('warn', message, data);
        console.warn(msg);
        this.saveToFile(msg);
    }

    error(message, error) {
        const msg = this.formatMessage('error', message, error ? { message: error.message, stack: error.stack } : null);
        console.error(msg);
        this.saveToFile(msg);
    }

    saveToFile(message) {
        const fileName = `${new Date().toISOString().split('T')[0]}.log`;
        fs.appendFileSync(path.join(this.logDir, fileName), message + '\n');
    }
}

module.exports = Logger;
