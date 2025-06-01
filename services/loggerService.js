const fs = require('fs').promises;
const path = require('path');

class LoggerService {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.maxLogSize = 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = 10;
        this.ensureLogDirectory();
    }

    async ensureLogDirectory() {
        try {
            await fs.access(this.logDir);
        } catch (error) {
            await fs.mkdir(this.logDir, { recursive: true });
        }
    }

    async log(level, message, metadata = {}) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level: level.toUpperCase(),
                message,
                metadata,
                pid: process.pid
            };

            // Write to appropriate log file
            await this.writeToLogFile(level, logEntry);

            // Also log to console in development
            if (process.env.NODE_ENV !== 'production') {
                this.logToConsole(logEntry);
            }
        } catch (error) {
            console.error('Error writing to log:', error);
        }
    }

    async writeToLogFile(level, logEntry) {
        const filename = this.getLogFilename(level);
        const logPath = path.join(this.logDir, filename);
        const logLine = JSON.stringify(logEntry) + '\n';

        try {
            // Check if log rotation is needed
            await this.rotateLogIfNeeded(logPath);
            
            // Append to log file
            await fs.appendFile(logPath, logLine);
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    async rotateLogIfNeeded(logPath) {
        try {
            const stats = await fs.stat(logPath);
            if (stats.size > this.maxLogSize) {
                await this.rotateLog(logPath);
            }
        } catch (error) {
            // File doesn't exist yet, no rotation needed
        }
    }

    async rotateLog(logPath) {
        try {
            const baseName = path.basename(logPath, '.log');
            const dir = path.dirname(logPath);

            // Shift existing rotated logs
            for (let i = this.maxLogFiles - 1; i > 0; i--) {
                const oldFile = path.join(dir, `${baseName}.${i}.log`);
                const newFile = path.join(dir, `${baseName}.${i + 1}.log`);
                
                try {
                    await fs.rename(oldFile, newFile);
                } catch (error) {
                    // File doesn't exist, continue
                }
            }

            // Move current log to .1
            const rotatedFile = path.join(dir, `${baseName}.1.log`);
            await fs.rename(logPath, rotatedFile);

            console.log(`Log rotated: ${logPath}`);
        } catch (error) {
            console.error('Error rotating log:', error);
        }
    }

    getLogFilename(level) {
        const date = new Date().toISOString().split('T')[0];
        return `${level}-${date}.log`;
    }

    logToConsole(logEntry) {
        const { timestamp, level, message, metadata } = logEntry;
        const colorMap = {
            ERROR: '\x1b[31m',   // Red
            WARN: '\x1b[33m',    // Yellow
            INFO: '\x1b[36m',    // Cyan
            DEBUG: '\x1b[35m',   // Magenta
            RESET: '\x1b[0m'     // Reset
        };

        const color = colorMap[level] || colorMap.RESET;
        const metaStr = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
        
        console.log(`${color}[${timestamp}] ${level}: ${message}${metaStr}${colorMap.RESET}`);
    }

    // Convenience methods
    async error(message, metadata = {}) {
        await this.log('error', message, metadata);
    }

    async warn(message, metadata = {}) {
        await this.log('warn', message, metadata);
    }

    async info(message, metadata = {}) {
        await this.log('info', message, metadata);
    }

    async debug(message, metadata = {}) {
        await this.log('debug', message, metadata);
    }

    // Business-specific logging methods
    async logOrderActivity(action, orderId, userId, details = {}) {
        await this.info(`Order ${action}`, {
            type: 'order_activity',
            action,
            orderId,
            userId,
            ...details
        });
    }

    async logUserActivity(action, userId, details = {}) {
        await this.info(`User ${action}`, {
            type: 'user_activity',
            action,
            userId,
            ...details
        });
    }

    async logInventoryActivity(action, itemId, userId, details = {}) {
        await this.info(`Inventory ${action}`, {
            type: 'inventory_activity',
            action,
            itemId,
            userId,
            ...details
        });
    }

    async logSystemActivity(action, details = {}) {
        await this.info(`System ${action}`, {
            type: 'system_activity',
            action,
            ...details
        });
    }

    async logSecurityEvent(event, userId, details = {}) {
        await this.warn(`Security event: ${event}`, {
            type: 'security_event',
            event,
            userId,
            ip: details.ip,
            userAgent: details.userAgent,
            ...details
        });
    }

    async logApiRequest(method, url, userId, statusCode, responseTime, details = {}) {
        await this.info(`API ${method} ${url}`, {
            type: 'api_request',
            method,
            url,
            userId,
            statusCode,
            responseTime,
            ...details
        });
    }

    async logEmailActivity(action, recipient, subject, success, details = {}) {
        await this.info(`Email ${action}`, {
            type: 'email_activity',
            action,
            recipient,
            subject,
            success,
            ...details
        });
    }

    async logSmsActivity(action, recipient, success, details = {}) {
        await this.info(`SMS ${action}`, {
            type: 'sms_activity',
            action,
            recipient,
            success,
            ...details
        });
    }

    // Log analysis methods
    async getLogsByLevel(level, startDate, endDate) {
        try {
            const logs = [];
            const files = await fs.readdir(this.logDir);
            
            for (const file of files) {
                if (file.includes(level.toLowerCase())) {
                    const filePath = path.join(this.logDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const lines = content.trim().split('\n').filter(line => line);
                    
                    for (const line of lines) {
                        try {
                            const logEntry = JSON.parse(line);
                            const logDate = new Date(logEntry.timestamp);
                            
                            if ((!startDate || logDate >= startDate) && 
                                (!endDate || logDate <= endDate)) {
                                logs.push(logEntry);
                            }
                        } catch (error) {
                            // Skip invalid JSON lines
                        }
                    }
                }
            }
            
            return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('Error getting logs by level:', error);
            return [];
        }
    }

    async getLogsByType(type, startDate, endDate) {
        try {
            const logs = [];
            const files = await fs.readdir(this.logDir);
            
            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const lines = content.trim().split('\n').filter(line => line);
                
                for (const line of lines) {
                    try {
                        const logEntry = JSON.parse(line);
                        const logDate = new Date(logEntry.timestamp);
                        
                        if (logEntry.metadata?.type === type &&
                            (!startDate || logDate >= startDate) && 
                            (!endDate || logDate <= endDate)) {
                            logs.push(logEntry);
                        }
                    } catch (error) {
                        // Skip invalid JSON lines
                    }
                }
            }
            
            return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('Error getting logs by type:', error);
            return [];
        }
    }

    async getLogStats(startDate, endDate) {
        try {
            const stats = {
                total: 0,
                byLevel: { error: 0, warn: 0, info: 0, debug: 0 },
                byType: {},
                timeRange: { start: startDate, end: endDate }
            };

            const files = await fs.readdir(this.logDir);
            
            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const lines = content.trim().split('\n').filter(line => line);
                
                for (const line of lines) {
                    try {
                        const logEntry = JSON.parse(line);
                        const logDate = new Date(logEntry.timestamp);
                        
                        if ((!startDate || logDate >= startDate) && 
                            (!endDate || logDate <= endDate)) {
                            
                            stats.total++;
                            
                            // Count by level
                            const level = logEntry.level.toLowerCase();
                            if (stats.byLevel[level] !== undefined) {
                                stats.byLevel[level]++;
                            }
                            
                            // Count by type
                            const type = logEntry.metadata?.type || 'general';
                            stats.byType[type] = (stats.byType[type] || 0) + 1;
                        }
                    } catch (error) {
                        // Skip invalid JSON lines
                    }
                }
            }
            
            return stats;
        } catch (error) {
            console.error('Error getting log stats:', error);
            return null;
        }
    }

    async cleanupOldLogs(maxAge = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAge);
            
            const files = await fs.readdir(this.logDir);
            let deletedCount = 0;
            
            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.birthtime < cutoffDate) {
                    await fs.unlink(filePath);
                    deletedCount++;
                }
            }
            
            console.log(`Cleaned up ${deletedCount} old log files`);
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up old logs:', error);
            throw error;
        }
    }

    async exportLogs(startDate, endDate, format = 'json') {
        try {
            const logs = [];
            const files = await fs.readdir(this.logDir);
            
            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const lines = content.trim().split('\n').filter(line => line);
                
                for (const line of lines) {
                    try {
                        const logEntry = JSON.parse(line);
                        const logDate = new Date(logEntry.timestamp);
                        
                        if ((!startDate || logDate >= startDate) && 
                            (!endDate || logDate <= endDate)) {
                            logs.push(logEntry);
                        }
                    } catch (error) {
                        // Skip invalid JSON lines
                    }
                }
            }
            
            logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            if (format === 'csv') {
                return this.convertLogsToCSV(logs);
            }
            
            return JSON.stringify(logs, null, 2);
        } catch (error) {
            console.error('Error exporting logs:', error);
            throw error;
        }
    }

    convertLogsToCSV(logs) {
        if (logs.length === 0) return '';
        
        const headers = ['timestamp', 'level', 'message', 'type', 'metadata'];
        const csvLines = [headers.join(',')];
        
        for (const log of logs) {
            const row = [
                log.timestamp,
                log.level,
                `"${log.message.replace(/"/g, '""')}"`,
                log.metadata?.type || '',
                `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"`
            ];
            csvLines.push(row.join(','));
        }
        
        return csvLines.join('\n');
    }
}

module.exports = new LoggerService();
