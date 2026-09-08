const mongoose = require('mongoose');

let isInMemoryFallback = false;
let inMemoryProjects = new Map();

const connectDB = async () => {
  const connString = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!connString) {
    console.log('[Database] No MongoDB URI provided. Using reliable in-memory data store.');
    isInMemoryFallback = true;
    return;
  }
  try {
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
