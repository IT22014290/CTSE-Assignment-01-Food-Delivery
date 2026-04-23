require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const restaurantRoutes = require('./routes/restaurantRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json());

app.use('/', restaurantRoutes);
app.use(errorHandler);

module.exports = app;
