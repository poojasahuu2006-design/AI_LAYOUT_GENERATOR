const mongoose = require('mongoose');

let isInMemoryFallback = false;
let inMemoryProjects = new Map();

const connectDB = async () => {
  const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_house_planner';
  try {
    // Attempt connecting to MongoDB with a short timeout
    await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[Database] MongoDB Connected to ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[Database Warning] MongoDB connection failed (${err.message}). Using local in-memory data store for seamless operation.`);
    isInMemoryFallback = true;
  }
};

const getInMemoryStore = () => ({
  isInMemoryFallback,
  inMemoryProjects
});

module.exports = { connectDB, getInMemoryStore };
