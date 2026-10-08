const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const sendResponse = require('./utils/sendResponse');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS config
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser, reading data from body into req.body with limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again in 15 minutes!',
});
app.use('/api', limiter);

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const timelineRoutes = require('./routes/timelineRoutes');
const leadRoutes = require('./routes/leadRoutes');

// Health check route
app.get('/api/health', (req, res) => {
  sendResponse(res, 200, 'API is running properly.');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/leads', leadRoutes);

// 404 handler for unknown routes
app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// Central Error Handling Middleware
app.use(errorHandler);

module.exports = app;
