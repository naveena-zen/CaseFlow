const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('CaseFlow - MongoDB Connected');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Collections in caseflow database:');
    collections.forEach(col => console.log('  →', col.name));

  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
