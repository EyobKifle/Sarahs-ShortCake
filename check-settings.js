const mongoose = require('mongoose');
const Settings = require('./models/Settings');

async function checkSettings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs_cakes');
        console.log('✅ Connected to MongoDB');

        const settings = await Settings.findOne();
        
        if (!settings) {
            console.log('❌ No settings found');
            return;
        }

        console.log('\n📋 Current Settings in Database:');
        console.log('='.repeat(50));
        console.log('Full settings object:');
        console.log(JSON.stringify(settings, null, 2));
        
        console.log('\n📧 Email Settings:');
        console.log('emailSettings:', settings.emailSettings);
        console.log('emailSettings.testMode:', settings.emailSettings?.testMode);
        
        console.log('\n📱 SMS Settings:');
        console.log('smsSettings:', settings.smsSettings);
        console.log('smsSettings.testMode:', settings.smsSettings?.testMode);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

checkSettings();
