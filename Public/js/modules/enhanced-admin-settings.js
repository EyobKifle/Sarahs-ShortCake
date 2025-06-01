/**
 * Enhanced Admin Settings Module
 * Comprehensive settings management with email and SMS configuration
 */

class EnhancedAdminSettings {
    constructor() {
        this.settings = {};
        this.originalSettings = {};
        this.hasUnsavedChanges = false;
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log('🔧 Enhanced Admin Settings module initialized');
        this.setupEventListeners();
        this.loadSettings();
        this.setupFormValidation();
    }

    setupEventListeners() {
        // Save settings button
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Test email button
        const testEmailBtn = document.getElementById('testEmailBtn');
        if (testEmailBtn) {
            testEmailBtn.addEventListener('click', () => {
                this.testEmailConfig();
            });
        }

        // Test SMS button
        const testSmsBtn = document.getElementById('testSmsBtn');
        if (testSmsBtn) {
            testSmsBtn.addEventListener('click', () => {
                this.testSmsConfig();
            });
        }

        // Backup database button
        const backupDbBtn = document.getElementById('backupDbBtn');
        if (backupDbBtn) {
            backupDbBtn.addEventListener('click', () => {
                this.backupDatabase();
            });
        }

        // Load system info button
        const loadSystemInfoBtn = document.getElementById('loadSystemInfoBtn');
        if (loadSystemInfoBtn) {
            loadSystemInfoBtn.addEventListener('click', () => {
                this.loadSystemInfo();
            });
        }

        // SMS provider change
        const smsProviderSelect = document.getElementById('smsProvider');
        if (smsProviderSelect) {
            smsProviderSelect.addEventListener('change', (e) => {
                this.toggleSmsProviderFields(e.target.value);
            });
        }

        // Form change detection
        const form = document.getElementById('settingsForm');
        if (form) {
            form.addEventListener('input', () => {
                this.markAsChanged();
            });
            form.addEventListener('change', () => {
                this.markAsChanged();
            });
        }

        // Prevent leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    setupFormValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateEmail(input);
            });
        });

        // Phone validation
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validatePhone(input);
            });
        });

        // Required field validation
        const requiredInputs = document.querySelectorAll('input[required]');
        requiredInputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateRequired(input);
            });
        });
    }

    async loadSettings() {
        try {
            this.showLoading(true);
            console.log('📡 Loading settings from server...');

            const response = await window.apiClient.getSettings();

            if (response && response.success) {
                this.settings = response.data;
                this.originalSettings = JSON.parse(JSON.stringify(response.data));
                this.populateSettingsForm();
                this.showNotification('Settings loaded successfully', 'success');
                console.log('✅ Settings loaded:', this.settings);
            } else {
                throw new Error('Failed to load settings');
            }
        } catch (error) {
            console.error('❌ Error loading settings:', error);
            this.showNotification('Error loading settings: ' + error.message, 'error');
            this.loadDefaultSettings();
        } finally {
            this.showLoading(false);
        }
    }

    populateSettingsForm() {
        if (!this.settings) return;

        // Business Information
        this.setFieldValue('businessName', this.settings.businessName);
        this.setFieldValue('businessEmail', this.settings.businessEmail);
        this.setFieldValue('businessPhone', this.settings.businessPhone);
        this.setFieldValue('businessAddress', this.settings.businessAddress);
        this.setFieldValue('businessDescription', this.settings.businessDescription);

        // Notification Settings
        this.setFieldValue('emailNotifications', this.settings.emailNotifications);
        this.setFieldValue('smsNotifications', this.settings.smsNotifications);
        this.setFieldValue('lowStockAlerts', this.settings.lowStockAlerts);
        this.setFieldValue('newOrderAlerts', this.settings.newOrderAlerts);

        // Email Settings
        if (this.settings.emailSettings) {
            this.setFieldValue('smtpHost', this.settings.emailSettings.smtpHost);
            this.setFieldValue('smtpPort', this.settings.emailSettings.smtpPort);
            this.setFieldValue('smtpUser', this.settings.emailSettings.smtpUser);
            this.setFieldValue('smtpPassword', this.settings.emailSettings.smtpPassword);
            this.setFieldValue('fromEmail', this.settings.emailSettings.fromEmail);
            this.setFieldValue('fromName', this.settings.emailSettings.fromName);
            this.setFieldValue('useSSL', this.settings.emailSettings.useSSL);
        }

        // SMS Settings
        if (this.settings.smsSettings) {
            this.setFieldValue('smsProvider', this.settings.smsSettings.provider);
            this.setFieldValue('accountSid', this.settings.smsSettings.accountSid);
            this.setFieldValue('authToken', this.settings.smsSettings.authToken);
            this.setFieldValue('fromNumber', this.settings.smsSettings.fromNumber);
            this.setFieldValue('apiKey', this.settings.smsSettings.apiKey);
            this.setFieldValue('senderId', this.settings.smsSettings.senderId);
            this.setFieldValue('apiUrl', this.settings.smsSettings.apiUrl);

            // Toggle SMS provider fields
            this.toggleSmsProviderFields(this.settings.smsSettings.provider);
        }

        // Business Hours
        if (this.settings.businessHours) {
            Object.keys(this.settings.businessHours).forEach(day => {
                const daySettings = this.settings.businessHours[day];
                this.setFieldValue(`${day}Open`, daySettings.open);
                this.setFieldValue(`${day}Close`, daySettings.close);
                this.setFieldValue(`${day}Closed`, daySettings.closed);
            });
        }

        this.hasUnsavedChanges = false;
        this.updateSaveButtonState();
    }

    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        if (field.type === 'checkbox') {
            field.checked = Boolean(value);
        } else {
            field.value = value || '';
        }
    }

    getFormData() {
        const formData = new FormData(document.getElementById('settingsForm'));
        const settings = {};

        // Business Information
        settings.businessName = formData.get('businessName');
        settings.businessEmail = formData.get('businessEmail');
        settings.businessPhone = formData.get('businessPhone');
        settings.businessAddress = formData.get('businessAddress');
        settings.businessDescription = formData.get('businessDescription');

        // Notification Settings
        settings.emailNotifications = formData.has('emailNotifications');
        settings.smsNotifications = formData.has('smsNotifications');
        settings.lowStockAlerts = formData.has('lowStockAlerts');
        settings.newOrderAlerts = formData.has('newOrderAlerts');

        // Email Settings
        settings.emailSettings = {
            smtpHost: formData.get('smtpHost'),
            smtpPort: parseInt(formData.get('smtpPort')) || 587,
            smtpUser: formData.get('smtpUser'),
            smtpPassword: formData.get('smtpPassword'),
            fromEmail: formData.get('fromEmail'),
            fromName: formData.get('fromName'),
            useSSL: formData.has('useSSL')
        };

        // SMS Settings
        settings.smsSettings = {
            provider: formData.get('smsProvider'),
            accountSid: formData.get('accountSid'),
            authToken: formData.get('authToken'),
            fromNumber: formData.get('fromNumber'),
            apiKey: formData.get('apiKey'),
            senderId: formData.get('senderId'),
            apiUrl: formData.get('apiUrl')
        };

        // Business Hours
        settings.businessHours = {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            settings.businessHours[day] = {
                open: formData.get(`${day}Open`),
                close: formData.get(`${day}Close`),
                closed: formData.has(`${day}Closed`)
            };
        });

        return settings;
    }

    async saveSettings() {
        try {
            if (!this.validateForm()) {
                this.showNotification('Please fix validation errors before saving', 'warning');
                return;
            }

            this.showLoading(true);
            const settings = this.getFormData();

            console.log('💾 Saving settings:', settings);
            const response = await window.apiClient.updateSettings(settings);

            if (response && response.success) {
                this.settings = response.data;
                this.originalSettings = JSON.parse(JSON.stringify(response.data));
                this.hasUnsavedChanges = false;
                this.updateSaveButtonState();
                this.showNotification('Settings saved successfully!', 'success');
                console.log('✅ Settings saved successfully');
            } else {
                throw new Error(response?.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('❌ Error saving settings:', error);
            this.showNotification('Error saving settings: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async testEmailConfig() {
        try {
            const testEmail = document.getElementById('testEmailAddress')?.value;
            if (!testEmail) {
                this.showNotification('Please enter a test email address', 'warning');
                return;
            }

            if (!this.validateEmail(document.getElementById('testEmailAddress'))) {
                this.showNotification('Please enter a valid email address', 'warning');
                return;
            }

            this.showLoading(true, 'Sending test email...');

            // Get current email settings from form
            const formData = this.getFormData();
            const emailSettings = formData.emailSettings;

            const response = await window.apiClient.testEmailConfig({
                testEmail: testEmail,
                emailSettings: emailSettings
            });

            if (response && response.success) {
                this.showNotification(`Test email sent successfully to ${testEmail}!`, 'success');
                console.log('✅ Test email sent:', response.details);
            } else {
                throw new Error(response?.message || 'Failed to send test email');
            }
        } catch (error) {
            console.error('❌ Error sending test email:', error);
            this.showNotification('Error sending test email: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async testSmsConfig() {
        try {
            const testPhone = document.getElementById('testPhoneNumber')?.value;
            if (!testPhone) {
                this.showNotification('Please enter a test phone number', 'warning');
                return;
            }

            if (!this.validatePhone(document.getElementById('testPhoneNumber'))) {
                this.showNotification('Please enter a valid phone number', 'warning');
                return;
            }

            this.showLoading(true, 'Sending test SMS...');

            // Get current SMS settings from form
            const formData = this.getFormData();
            const smsSettings = formData.smsSettings;

            const response = await window.apiClient.testSmsConfig({
                testPhone: testPhone,
                smsSettings: smsSettings
            });

            if (response && response.success) {
                this.showNotification(`Test SMS sent successfully to ${testPhone}!`, 'success');
                console.log('✅ Test SMS sent:', response.details);
            } else {
                throw new Error(response?.message || 'Failed to send test SMS');
            }
        } catch (error) {
            console.error('❌ Error sending test SMS:', error);
            this.showNotification('Error sending test SMS: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async backupDatabase() {
        try {
            this.showLoading(true, 'Creating database backup...');

            const response = await window.apiClient.backupDatabase();

            if (response && response.success) {
                this.showNotification(`Database backup created: ${response.filename}`, 'success');
                console.log('✅ Database backup created:', response.filename);
            } else {
                throw new Error(response?.message || 'Failed to create backup');
            }
        } catch (error) {
            console.error('❌ Error creating backup:', error);
            this.showNotification('Error creating backup: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadSystemInfo() {
        try {
            this.showLoading(true, 'Loading system information...');

            const response = await window.apiClient.getSystemInfo();

            if (response && response.success) {
                this.displaySystemInfo(response.data);
                this.showNotification('System information loaded', 'success');
            } else {
                throw new Error(response?.message || 'Failed to load system info');
            }
        } catch (error) {
            console.error('❌ Error loading system info:', error);
            this.showNotification('Error loading system info: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displaySystemInfo(systemInfo) {
        const container = document.getElementById('systemInfoContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-server me-2"></i>System Information</h6>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <tr><td><strong>Version:</strong></td><td>${systemInfo.version}</td></tr>
                                <tr><td><strong>Node.js:</strong></td><td>${systemInfo.nodeVersion}</td></tr>
                                <tr><td><strong>Platform:</strong></td><td>${systemInfo.platform}</td></tr>
                                <tr><td><strong>Architecture:</strong></td><td>${systemInfo.architecture}</td></tr>
                                <tr><td><strong>Uptime:</strong></td><td>${systemInfo.uptime}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-database me-2"></i>Resources</h6>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <tr><td><strong>Total Memory:</strong></td><td>${systemInfo.totalMemory}</td></tr>
                                <tr><td><strong>Free Memory:</strong></td><td>${systemInfo.freeMemory}</td></tr>
                                <tr><td><strong>Database:</strong></td><td>
                                    <span class="badge ${systemInfo.database === 'Connected' ? 'bg-success' : 'bg-danger'}">
                                        ${systemInfo.database}
                                    </span>
                                </td></tr>
                                <tr><td><strong>Storage Used:</strong></td><td>${systemInfo.storageUsed}</td></tr>
                                <tr><td><strong>Last Updated:</strong></td><td>${new Date(systemInfo.lastUpdated).toLocaleString()}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    toggleSmsProviderFields(provider) {
        const twilioFields = document.getElementById('twilioFields');
        const ethiopiaTelecomFields = document.getElementById('ethiopiaTelecomFields');

        if (twilioFields && ethiopiaTelecomFields) {
            if (provider === 'twilio') {
                twilioFields.style.display = 'block';
                ethiopiaTelecomFields.style.display = 'none';
            } else if (provider === 'ethiopia_telecom') {
                twilioFields.style.display = 'none';
                ethiopiaTelecomFields.style.display = 'block';
            } else {
                twilioFields.style.display = 'none';
                ethiopiaTelecomFields.style.display = 'none';
            }
        }
    }

    validateForm() {
        let isValid = true;
        const requiredFields = document.querySelectorAll('input[required]');

        requiredFields.forEach(field => {
            if (!this.validateRequired(field)) {
                isValid = false;
            }
        });

        const emailFields = document.querySelectorAll('input[type="email"]');
        emailFields.forEach(field => {
            if (field.value && !this.validateEmail(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateRequired(field) {
        const isValid = field.value.trim() !== '';
        this.setFieldValidation(field, isValid, 'This field is required');
        return isValid;
    }

    validateEmail(field) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = !field.value || emailRegex.test(field.value);
        this.setFieldValidation(field, isValid, 'Please enter a valid email address');
        return isValid;
    }

    validatePhone(field) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const isValid = !field.value || phoneRegex.test(field.value.replace(/[\s\-\(\)]/g, ''));
        this.setFieldValidation(field, isValid, 'Please enter a valid phone number');
        return isValid;
    }

    setFieldValidation(field, isValid, errorMessage) {
        const feedback = field.parentNode.querySelector('.invalid-feedback');

        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            if (feedback) feedback.style.display = 'none';
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            if (feedback) {
                feedback.textContent = errorMessage;
                feedback.style.display = 'block';
            }
        }
    }

    markAsChanged() {
        this.hasUnsavedChanges = true;
        this.updateSaveButtonState();
    }

    updateSaveButtonState() {
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            if (this.hasUnsavedChanges) {
                saveBtn.classList.remove('btn-outline-primary');
                saveBtn.classList.add('btn-primary');
                saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Save Changes';
            } else {
                saveBtn.classList.remove('btn-primary');
                saveBtn.classList.add('btn-outline-primary');
                saveBtn.innerHTML = '<i class="fas fa-check me-1"></i>Saved';
            }
        }
    }

    showLoading(show, message = 'Loading...') {
        this.isLoading = show;
        const loader = document.getElementById('settingsLoader');
        const content = document.getElementById('settingsContent');

        if (loader && content) {
            if (show) {
                loader.style.display = 'block';
                loader.querySelector('.loading-text').textContent = message;
                content.style.opacity = '0.5';
            } else {
                loader.style.display = 'none';
                content.style.opacity = '1';
            }
        }
    }

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);

        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    loadDefaultSettings() {
        console.log('📋 Loading default settings...');
        this.settings = {
            businessName: "Sarah's Short Cakes",
            businessEmail: "info@sarahsshortcakes.com",
            businessPhone: "+1 (555) 123-4567",
            businessAddress: "123 Sweet Street, Bakery City",
            businessDescription: "Delicious homemade cupcakes and cakes made with love and the finest ingredients.",
            emailNotifications: true,
            smsNotifications: false,
            lowStockAlerts: true,
            newOrderAlerts: true,
            emailSettings: {
                smtpHost: 'smtp.gmail.com',
                smtpPort: 587,
                smtpUser: 'eyobkifle456@gmail.com',
                smtpPassword: '',
                fromEmail: 'info@sarahsshortcakes.com',
                fromName: 'Sarahs ShortCakes',
                useSSL: true
            },
            smsSettings: {
                provider: 'afromessage',
                afroMessageApiKey: 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoiRWdKZFlmOHBMNENDRUhra3RnZ1pBdXZoaWxEZXVGYnEiLCJleHAiOjE5MDYyMDY4NDcsImlhdCI6MTc0ODQ0MDQ0NywianRpIjoiNGVjMjE3MWEtYzg3OC00YzZjLTk3MzctZmIxY2I1MjgxMzJhIn0.QKK5HdkTFpcx3ov_Npg7qCBQYZ-7TrqjsLXzwYK8rvo',
                afroMessageSender: 'SARAHS',
                afroMessageIdentifierId: '',
                accountSid: '',
                authToken: '',
                fromNumber: '',
                apiKey: '',
                senderId: '',
                apiUrl: ''
            },
            businessHours: {
                monday: { open: '08:00', close: '18:00', closed: false },
                tuesday: { open: '08:00', close: '18:00', closed: false },
                wednesday: { open: '08:00', close: '18:00', closed: false },
                thursday: { open: '08:00', close: '18:00', closed: false },
                friday: { open: '08:00', close: '18:00', closed: false },
                saturday: { open: '09:00', close: '16:00', closed: false },
                sunday: { open: '10:00', close: '14:00', closed: true }
            }
        };
        this.populateSettingsForm();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.enhancedAdminSettings === 'undefined') {
        window.enhancedAdminSettings = new EnhancedAdminSettings();
    }
});