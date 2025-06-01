const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const extract = require('extract-zip');

class BackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '../backups');
        this.uploadsDir = path.join(__dirname, '../uploads');
        this.ensureBackupDirectory();
    }

    async ensureBackupDirectory() {
        try {
            await fs.access(this.backupDir);
        } catch (error) {
            await fs.mkdir(this.backupDir, { recursive: true });
        }
    }

    async createFullBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `full-backup-${timestamp}`;
            const backupPath = path.join(this.backupDir, `${backupName}.zip`);

            console.log('Starting full backup...');

            // Create database backup
            const dbBackup = await this.createDatabaseBackup();
            
            // Create files backup
            const filesBackup = await this.createFilesBackup();

            // Create combined backup zip
            await this.createBackupArchive(backupPath, dbBackup, filesBackup);

            // Clean up temporary files
            await this.cleanupTempFiles([dbBackup.filePath, filesBackup.filePath]);

            const stats = await fs.stat(backupPath);
            
            console.log('Full backup completed successfully');
            
            return {
                success: true,
                filename: `${backupName}.zip`,
                path: backupPath,
                size: this.formatFileSize(stats.size),
                timestamp: new Date(),
                type: 'full'
            };
        } catch (error) {
            console.error('Error creating full backup:', error);
            throw error;
        }
    }

    async createDatabaseBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `database-backup-${timestamp}.json`;
            const filePath = path.join(this.backupDir, filename);

            // Get all collections
            const collections = await mongoose.connection.db.listCollections().toArray();
            const backup = {
                metadata: {
                    timestamp: new Date(),
                    version: '1.0.0',
                    collections: collections.map(c => c.name)
                },
                data: {}
            };

            // Export each collection
            for (const collection of collections) {
                const collectionName = collection.name;
                console.log(`Backing up collection: ${collectionName}`);
                
                const data = await mongoose.connection.db
                    .collection(collectionName)
                    .find({})
                    .toArray();
                
                backup.data[collectionName] = data;
            }

            // Write backup file
            await fs.writeFile(filePath, JSON.stringify(backup, null, 2));

            console.log(`Database backup created: ${filename}`);
            
            return {
                filename,
                filePath,
                collections: collections.length,
                records: Object.values(backup.data).reduce((total, coll) => total + coll.length, 0)
            };
        } catch (error) {
            console.error('Error creating database backup:', error);
            throw error;
        }
    }

    async createFilesBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `files-backup-${timestamp}.zip`;
            const filePath = path.join(this.backupDir, filename);

            console.log('Creating files backup...');

            // Create zip archive for uploads
            await this.createZipArchive(this.uploadsDir, filePath);

            const stats = await fs.stat(filePath);
            
            console.log(`Files backup created: ${filename}`);
            
            return {
                filename,
                filePath,
                size: this.formatFileSize(stats.size)
            };
        } catch (error) {
            console.error('Error creating files backup:', error);
            throw error;
        }
    }

    async createBackupArchive(outputPath, dbBackup, filesBackup) {
        return new Promise((resolve, reject) => {
            const output = require('fs').createWriteStream(outputPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                console.log(`Backup archive created: ${this.formatFileSize(archive.pointer())} bytes`);
                resolve();
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            // Add database backup
            archive.file(dbBackup.filePath, { name: 'database.json' });
            
            // Add files backup
            archive.file(filesBackup.filePath, { name: 'files.zip' });

            // Add metadata
            const metadata = {
                created: new Date(),
                version: '1.0.0',
                type: 'full_backup',
                database: {
                    collections: dbBackup.collections,
                    records: dbBackup.records
                },
                files: {
                    size: filesBackup.size
                }
            };
            
            archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-metadata.json' });

            archive.finalize();
        });
    }

    async createZipArchive(sourceDir, outputPath) {
        return new Promise((resolve, reject) => {
            const output = require('fs').createWriteStream(outputPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    async restoreFromBackup(backupFilePath) {
        try {
            console.log('Starting restore from backup...');

            // Extract backup archive
            const extractDir = path.join(this.backupDir, 'temp-restore');
            await this.extractBackup(backupFilePath, extractDir);

            // Read metadata
            const metadataPath = path.join(extractDir, 'backup-metadata.json');
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

            console.log('Backup metadata:', metadata);

            // Restore database
            const dbPath = path.join(extractDir, 'database.json');
            await this.restoreDatabase(dbPath);

            // Restore files
            const filesPath = path.join(extractDir, 'files.zip');
            await this.restoreFiles(filesPath);

            // Clean up
            await this.cleanupDirectory(extractDir);

            console.log('Restore completed successfully');

            return {
                success: true,
                metadata,
                restoredAt: new Date()
            };
        } catch (error) {
            console.error('Error restoring from backup:', error);
            throw error;
        }
    }

    async restoreDatabase(backupFilePath) {
        try {
            console.log('Restoring database...');

            const backupData = JSON.parse(await fs.readFile(backupFilePath, 'utf8'));
            
            // Clear existing collections
            const collections = await mongoose.connection.db.listCollections().toArray();
            for (const collection of collections) {
                await mongoose.connection.db.collection(collection.name).deleteMany({});
                console.log(`Cleared collection: ${collection.name}`);
            }

            // Restore data
            for (const [collectionName, data] of Object.entries(backupData.data)) {
                if (data.length > 0) {
                    await mongoose.connection.db.collection(collectionName).insertMany(data);
                    console.log(`Restored ${data.length} documents to ${collectionName}`);
                }
            }

            console.log('Database restore completed');
        } catch (error) {
            console.error('Error restoring database:', error);
            throw error;
        }
    }

    async restoreFiles(filesBackupPath) {
        try {
            console.log('Restoring files...');

            // Clear existing uploads
            await this.cleanupDirectory(this.uploadsDir);

            // Extract files backup
            await extract(filesBackupPath, { dir: this.uploadsDir });

            console.log('Files restore completed');
        } catch (error) {
            console.error('Error restoring files:', error);
            throw error;
        }
    }

    async extractBackup(backupPath, extractDir) {
        try {
            await fs.mkdir(extractDir, { recursive: true });
            await extract(backupPath, { dir: extractDir });
        } catch (error) {
            console.error('Error extracting backup:', error);
            throw error;
        }
    }

    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backups = [];

            for (const file of files) {
                if (file.endsWith('.zip') || file.endsWith('.json')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);
                    
                    backups.push({
                        filename: file,
                        path: filePath,
                        size: this.formatFileSize(stats.size),
                        created: stats.birthtime,
                        modified: stats.mtime,
                        type: this.getBackupType(file)
                    });
                }
            }

            return backups.sort((a, b) => b.created - a.created);
        } catch (error) {
            console.error('Error listing backups:', error);
            throw error;
        }
    }

    async deleteBackup(filename) {
        try {
            const filePath = path.join(this.backupDir, filename);
            await fs.unlink(filePath);
            console.log(`Backup deleted: ${filename}`);
            return true;
        } catch (error) {
            console.error('Error deleting backup:', error);
            throw error;
        }
    }

    async cleanupOldBackups(maxAge = 30) {
        try {
            const backups = await this.listBackups();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAge);

            let deletedCount = 0;

            for (const backup of backups) {
                if (backup.created < cutoffDate) {
                    await this.deleteBackup(backup.filename);
                    deletedCount++;
                }
            }

            console.log(`Cleaned up ${deletedCount} old backups`);
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up old backups:', error);
            throw error;
        }
    }

    async cleanupTempFiles(filePaths) {
        for (const filePath of filePaths) {
            try {
                await fs.unlink(filePath);
            } catch (error) {
                console.warn(`Could not delete temp file: ${filePath}`);
            }
        }
    }

    async cleanupDirectory(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                
                if (stats.isDirectory()) {
                    await this.cleanupDirectory(filePath);
                    await fs.rmdir(filePath);
                } else {
                    await fs.unlink(filePath);
                }
            }
        } catch (error) {
            console.warn(`Could not cleanup directory: ${dirPath}`);
        }
    }

    getBackupType(filename) {
        if (filename.includes('full-backup')) return 'full';
        if (filename.includes('database-backup')) return 'database';
        if (filename.includes('files-backup')) return 'files';
        return 'unknown';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async getBackupStats() {
        try {
            const backups = await this.listBackups();
            const totalSize = backups.reduce((sum, backup) => {
                // Convert size string back to bytes for calculation
                const sizeStr = backup.size;
                const [value, unit] = sizeStr.split(' ');
                const multipliers = { 'Bytes': 1, 'KB': 1024, 'MB': 1024*1024, 'GB': 1024*1024*1024 };
                return sum + (parseFloat(value) * (multipliers[unit] || 1));
            }, 0);

            return {
                totalBackups: backups.length,
                totalSize: this.formatFileSize(totalSize),
                oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
                newestBackup: backups.length > 0 ? backups[0].created : null,
                backupTypes: {
                    full: backups.filter(b => b.type === 'full').length,
                    database: backups.filter(b => b.type === 'database').length,
                    files: backups.filter(b => b.type === 'files').length
                }
            };
        } catch (error) {
            console.error('Error getting backup stats:', error);
            throw error;
        }
    }
}

module.exports = new BackupService();
