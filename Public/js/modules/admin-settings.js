// Admin Settings Module
class AdminSettings {
    constructor() {
        this.settings = {};
        this.originalSettings = {};
        this.hasUnsavedChanges = false;
        this.setupEventListeners();
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

        // Reset settings button
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // SMS Provider change handler
        const smsProviderSelect = document.getElementById('smsProvider');
        if (smsProviderSelect) {
            smsProviderSelect.addEventListener('change', () => {
                this.handleSmsProviderChange();
            });
        }

        // Form change detection
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('input', () => {
                this.markAsChanged();
            });
            settingsForm.addEventListener('change', () => {
                this.markAsChanged();
            });
        }
    }

    async loadSettings() {
        try {
            console.log('Loading admin settings...');

            // Get settings from API directly
            const response = await fetch('/api/settings', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();

            if (result && result.success) {
                this.settings = result.data;
                this.originalSettings = JSON.parse(JSON.stringify(result.data));
                this.populateSettingsForm();
                this.loadSystemInfo();
                console.log('✅ Settings loaded successfully:', this.settings);
            } else {
                throw new Error('Failed to load settings from API');
            }
        } catch (error) {
            console.error('❌ Error loading settings, using defaults:', error);
            // Load default settings if API fails
            this.loadDefaultSettings();
        }
    }

    loadDefaultSettings() {
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
                smtpPassword: 'eqjd qpia odbz tiux',
                fromEmail: 'info@sarahsshortcakes.com',
                fromName: "Sarahs ShortCakes",
                useSSL: true
            },
            smsSettings: {
                provider: 'afromessage',
                afroMessageApiKey: 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoiRWdKZFlmOHBMNENDRUhra3RnZ1pBdXZoaWxEZXVGYnEiLCJleHAiOjE5MDYyMDY4NDcsImlhdCI6MTc0ODQ0MDQ0NywianRpIjoiNGVjMjE3MWEtYzg3OC00YzZjLTk3MzctZmIxY2I1MjgxMzJhIn0.QKK5HdkTFpcx3ov_Npg7qCBQYZ-7TrqjsLXzwYK8rvo',
                afroMessageSender: 'SARAHS',
                afroMessageIdentifierId: 'e80ad9d8-adf3-463f-80f4-7c4b39f7f164',
                afroMessageApiUrl: 'https://api.afromessage.com/api/send',
                accountSid: '',
                authToken: '',
                fromNumber: ''
            }
        };
        this.populateSettingsForm();
    }

    populateSettingsForm() {
        try {
            // Business Information
            this.setFieldValue('businessName', this.settings.businessName);
            this.setFieldValue('businessEmail', this.settings.businessEmail);
            this.setFieldValue('businessPhone', this.settings.businessPhone);
            this.setFieldValue('businessAddress', this.settings.businessAddress);
            this.setFieldValue('businessDescription', this.settings.businessDescription);

            // Notification Settings
            this.setCheckboxValue('emailNotifications', this.settings.emailNotifications);
            this.setCheckboxValue('smsNotifications', this.settings.smsNotifications);
            this.setCheckboxValue('lowStockAlerts', this.settings.lowStockAlerts);
            this.setCheckboxValue('newOrderAlerts', this.settings.newOrderAlerts);

            // Email Settings
            if (this.settings.emailSettings) {
                this.setFieldValue('smtpHost', this.settings.emailSettings.smtpHost);
                this.setFieldValue('smtpPort', this.settings.emailSettings.smtpPort);
                this.setFieldValue('smtpUser', this.settings.emailSettings.smtpUser);
                this.setFieldValue('smtpPassword', this.settings.emailSettings.smtpPassword);
                this.setFieldValue('fromEmail', this.settings.emailSettings.fromEmail);
                this.setFieldValue('fromName', this.settings.emailSettings.fromName);
                this.setCheckboxValue('useSSL', this.settings.emailSettings.useSSL);
            }

            // SMS Settings
            if (this.settings.smsSettings) {
                this.setFieldValue('smsProvider', this.settings.smsSettings.provider);
                // AfroMessage settings
                this.setFieldValue('afroMessageApiKey', this.settings.smsSettings.afroMessageApiKey);
                this.setFieldValue('afroMessageSender', this.settings.smsSettings.afroMessageSender);
                this.setFieldValue('afroMessageIdentifierId', this.settings.smsSettings.afroMessageIdentifierId);
                // Twilio settings
                this.setFieldValue('accountSid', this.settings.smsSettings.accountSid);
                this.setFieldValue('authToken', this.settings.smsSettings.authToken);
                this.setFieldValue('fromNumber', this.settings.smsSettings.fromNumber);
                // Ethiopia Telecom settings
                this.setFieldValue('apiKey', this.settings.smsSettings.apiKey);
                this.setFieldValue('senderId', this.settings.smsSettings.senderId);
                this.setFieldValue('apiUrl', this.settings.smsSettings.apiUrl);
            }

            this.hasUnsavedChanges = false;
            this.updateSaveButton();

            // Handle SMS provider field visibility
            this.handleSmsProviderChange();
        } catch (error) {
            console.error('Error populating settings form:', error);
        }
    }

    handleSmsProviderChange() {
        const provider = document.getElementById('smsProvider')?.value;

        // Hide all provider fields
        const providerFields = document.querySelectorAll('.provider-fields');
        providerFields.forEach(field => {
            field.style.display = 'none';
        });

        // Show relevant provider fields
        if (provider === 'afromessage') {
            const afroFields = document.getElementById('afroMessageFields');
            if (afroFields) afroFields.style.display = 'block';
        } else if (provider === 'twilio') {
            const twilioFields = document.getElementById('twilioFields');
            if (twilioFields) twilioFields.style.display = 'block';
        } else if (provider === 'ethiopia_telecom') {
            const etFields = document.getElementById('ethiopiaTelecomFields');
            if (etFields) etFields.style.display = 'block';
        }
    }

    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field && value !== undefined && value !== null) {
            field.value = value;
        }
    }

    setCheckboxValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.checked = Boolean(value);
        }
    }

    getFormData() {
        // Collect data directly from form elements instead of FormData
        const settings = {};

        // Business Information
        settings.businessName = document.getElementById('businessName')?.value || '';
        settings.businessEmail = document.getElementById('businessEmail')?.value || '';
        settings.businessPhone = document.getElementById('businessPhone')?.value || '';
        settings.businessWebsite = document.getElementById('businessWebsite')?.value || '';
        settings.businessAddress = document.getElementById('businessAddress')?.value || '';
        settings.businessDescription = document.getElementById('businessDescription')?.value || '';

        // Delivery settings
        settings.deliveryFee = parseFloat(document.getElementById('deliveryFee')?.value || 0);
        settings.deliveryRadius = parseInt(document.getElementById('deliveryRadius')?.value || 0);
        settings.enableDelivery = document.getElementById('enableDelivery')?.checked || false;
        settings.enablePickup = document.getElementById('enablePickup')?.checked || false;

        // Email Settings
        settings.emailSettings = {
            smtpHost: document.getElementById('smtpHost')?.value || '',
            smtpPort: parseInt(document.getElementById('smtpPort')?.value || 587),
            smtpUser: document.getElementById('smtpUser')?.value || '',
            smtpPassword: document.getElementById('smtpPassword')?.value || '',
            fromEmail: document.getElementById('fromEmail')?.value || '',
            fromName: document.getElementById('fromName')?.value || '',
            useSSL: document.getElementById('useSSL')?.checked || false
        };

        // SMS Settings
        settings.smsSettings = {
            provider: document.getElementById('smsProvider')?.value || 'afromessage',
            // AfroMessage settings
            afroMessageApiKey: document.getElementById('afroMessageApiKey')?.value || '',
            afroMessageSender: document.getElementById('afroMessageSender')?.value || '',
            afroMessageIdentifierId: document.getElementById('afroMessageIdentifierId')?.value || '',
            // Twilio settings
            accountSid: document.getElementById('twilioAccountSid')?.value || '',
            authToken: document.getElementById('twilioAuthToken')?.value || '',
            fromNumber: document.getElementById('twilioFromNumber')?.value || '',
            // Ethiopia Telecom settings
            apiKey: document.getElementById('apiKey')?.value || '',
            senderId: document.getElementById('senderId')?.value || '',
            apiUrl: document.getElementById('apiUrl')?.value || ''
        };

        // Notification Settings
        settings.emailOrderConfirmation = document.getElementById('emailOrderConfirmation')?.checked || false;
        settings.emailOrderReady = document.getElementById('emailOrderReady')?.checked || false;
        settings.emailPasswordReset = document.getElementById('emailPasswordReset')?.checked || false;
        settings.smsOrderConfirmation = document.getElementById('smsOrderConfirmation')?.checked || false;
        settings.smsOrderReady = document.getElementById('smsOrderReady')?.checked || false;

        // Security Settings
        settings.otpExpiryMinutes = parseInt(document.getElementById('otpExpiryMinutes')?.value || 10);
        settings.maxOtpAttempts = parseInt(document.getElementById('maxOtpAttempts')?.value || 3);

        console.log('Collected form data:', settings);
        return settings;
    }

    async saveSettings(settingsData = null) {
        try {
            const saveBtn = document.getElementById('saveSettingsBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Saving...';
            }

            // Use provided data or collect from form
            const dataToSave = settingsData || this.getFormData();

            console.log('Saving settings data:', dataToSave);

            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(dataToSave)
            });

            const result = await response.json();

            if (result && result.success) {
                this.settings = result.data;
                this.originalSettings = JSON.parse(JSON.stringify(result.data));
                this.hasUnsavedChanges = false;
                this.updateSaveButton();
                console.log('✅ Settings saved successfully:', result.data);
            } else {
                throw new Error(result?.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('❌ Error saving settings:', error);
        } finally {
            const saveBtn = document.getElementById('saveSettingsBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Save All Changes';
            }
        }
    }

    async testEmailConfig() {
        // Delegate to AdminManager to avoid conflicts
        if (window.AdminManager && window.AdminManager.testEmailConfiguration) {
            console.log('🔄 Delegating email test to AdminManager...');
            await window.AdminManager.testEmailConfiguration();
        } else {
            console.error('❌ AdminManager not available for email testing');
        }
    }

    async testSmsConfig() {
        try {
            // Get test phone from the form input instead of prompt
            const testPhone = document.getElementById('testSmsNumber')?.value;
            if (!testPhone) {
                console.log('⚠️ Please enter a test phone number in the form');
                return;
            }

            console.log('📱 Testing SMS configuration...');

            // Use the AdminManager's test function instead (it handles button states)
            if (window.AdminManager && window.AdminManager.testSmsConfiguration) {
                await window.AdminManager.testSmsConfiguration();
            } else {
                // Fallback to direct API call with button management
                const testBtn = document.getElementById('testSmsBtn');
                const originalText = testBtn?.innerHTML;

                try {
                    if (testBtn) {
                        testBtn.disabled = true;
                        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Sending Test SMS...';
                    }

                    const response = await window.apiClient.testSmsConfig({ testPhone });

                    if (response && response.success) {
                        console.log('✅ Test SMS sent successfully!');
                        if (testBtn) {
                            testBtn.innerHTML = '<i class="fas fa-check me-1"></i> SMS Sent!';
                            testBtn.classList.add('btn-success');
                            setTimeout(() => {
                                testBtn.innerHTML = originalText;
                                testBtn.classList.remove('btn-success');
                                testBtn.disabled = false;
                            }, 3000);
                        }
                    } else {
                        throw new Error(response?.message || 'Failed to send test SMS');
                    }
                } catch (error) {
                    console.error('❌ Error testing SMS config:', error);
                    if (testBtn) {
                        testBtn.innerHTML = '<i class="fas fa-times me-1"></i> Failed';
                        testBtn.classList.add('btn-danger');
                        setTimeout(() => {
                            testBtn.innerHTML = originalText;
                            testBtn.classList.remove('btn-danger');
                            testBtn.disabled = false;
                        }, 3000);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error testing SMS config:', error);
        }
    }

    async loadSystemInfo() {
        try {
            const response = await window.apiClient.getSystemInfo();

            if (response && response.success) {
                this.displaySystemInfo(response.data);
            }
        } catch (error) {
            console.error('Error loading system info:', error);
        }
    }

    displaySystemInfo(systemInfo) {
        const systemInfoContainer = document.getElementById('systemInfo');
        if (!systemInfoContainer) return;

        systemInfoContainer.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <h6 class="card-title">System Version</h6>
                            <p class="card-text">${systemInfo.version}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <h6 class="card-title">Node.js Version</h6>
                            <p class="card-text">${systemInfo.nodeVersion}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <h6 class="card-title">Database Status</h6>
                            <p class="card-text">
                                <span class="badge ${systemInfo.database === 'Connected' ? 'bg-success' : 'bg-danger'}">
                                    ${systemInfo.database}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <h6 class="card-title">Storage Used</h6>
                            <p class="card-text">${systemInfo.storageUsed}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <h6 class="card-title">Memory Usage</h6>
                            <p class="card-text">${systemInfo.freeMemory} / ${systemInfo.totalMemory}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <h6 class="card-title">Uptime</h6>
                            <p class="card-text">${systemInfo.uptime}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async backupDatabase() {
        try {
            if (!confirm('Are you sure you want to create a database backup? This may take a few moments.')) {
                return;
            }

            const backupBtn = document.getElementById('backupDbBtn');
            if (backupBtn) {
                backupBtn.disabled = true;
                backupBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Creating Backup...';
            }

            const response = await window.apiClient.backupDatabase();

            if (response && response.success) {
                this.showNotification(`Database backup created successfully: ${response.filename}`, 'success');
            } else {
                throw new Error(response?.message || 'Failed to create backup');
            }
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showNotification('Error creating backup: ' + error.message, 'error');
        } finally {
            const backupBtn = document.getElementById('backupDbBtn');
            if (backupBtn) {
                backupBtn.disabled = false;
                backupBtn.innerHTML = '<i class="fas fa-database me-1"></i> Backup Database';
            }
        }
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to their original values? This will discard any unsaved changes.')) {
            this.settings = JSON.parse(JSON.stringify(this.originalSettings));
            this.populateSettingsForm();
            this.hasUnsavedChanges = false;
            this.updateSaveButton();
            this.showNotification('Settings reset to original values', 'info');
        }
    }

    markAsChanged() {
        this.hasUnsavedChanges = true;
        this.updateSaveButton();
    }

    updateSaveButton() {
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            saveBtn.disabled = !this.hasUnsavedChanges;
            if (this.hasUnsavedChanges) {
                saveBtn.classList.remove('btn-outline-primary');
                saveBtn.classList.add('btn-primary');
            } else {
                saveBtn.classList.remove('btn-primary');
                saveBtn.classList.add('btn-outline-primary');
            }
        }
    }

    showNotification(message, type = 'info') {
        if (window.AdminManager && window.AdminManager.showNotification) {
            window.AdminManager.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Export for use in other modules
window.AdminSettings = AdminSettings;
