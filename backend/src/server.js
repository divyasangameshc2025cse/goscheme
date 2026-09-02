const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabaseSchema } = require('./db/database');
const { seedDatabase } = require('./db/seed');

const authRoutes = require('./routes/auth');
const schemesRoutes = require('./routes/schemes');
const savedRoutes = require('./routes/saved');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/saved-schemes', savedRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'GoScheme Backend API',
    database: 'SQLite',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Start Server & Initialize Database
async function startServer() {
  try {
    await initDatabaseSchema();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 GoScheme Backend API Server running on port ${PORT}`);
      console.log(`👉 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
