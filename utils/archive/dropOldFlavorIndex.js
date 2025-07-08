require('dotenv').config();
const connectDB = require('./db');

const dropOldIndex = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        const db = require('mongoose').connection.db;
        const collection = db.collection('flavors');

        // List current indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        // Drop the old unique index on "name" if it exists
        const nameIndex = indexes.find(index => index.key && index.key.name === 1 && index.unique);
        if (nameIndex) {
            await collection.dropIndex(nameIndex.name);
            console.log(`Dropped old index: ${nameIndex.name}`);
        } else {
            console.log('No old unique index on "name" found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error dropping old index:', error);
        process.exit(1);
    }
};

dropOldIndex();
