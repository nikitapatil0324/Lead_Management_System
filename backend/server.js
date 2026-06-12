const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/logs', logRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date(), 
    message: 'Lead Management API is active.' 
  });
});

app.use((err, req, res, next) => {
  console.error('Global Error Handler caught:', err.stack);
  res.status(500).json({ 
    error: 'An internal server error occurred on the API backend.' 
  });
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` MINI LEAD MANAGEMENT BACKEND RUNNING ON PORT ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(`===================================================`);
});
