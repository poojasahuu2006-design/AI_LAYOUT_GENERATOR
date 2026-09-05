require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const layoutRoutes = require('./routes/layoutRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// CORS Middleware - allow cross origin requests
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/layout', layoutRoutes);
app.use('/api/ai', layoutRoutes); // Aliased for /api/ai/parse-requirements

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'AI House Planner Backend',
    timestamp: new Date().toISOString()
  });
});

// Catch-all 404 JSON Handler for any unmatched route (guarantees NO HTML is EVER returned)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.originalUrl}' not found.`
  });
});

// Global Error Handler (guarantees JSON format for internal server errors)
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🚀 AI House Planner Backend Server running on port ${PORT}`);
  console.log(` 🌐 Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
