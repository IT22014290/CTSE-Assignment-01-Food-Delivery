require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const restaurantRoutes = require('./routes/restaurantRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json());

const swaggerDocument = yaml.load(fs.readFileSync(path.join(__dirname, '../swagger.yaml'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/', restaurantRoutes);
app.use(errorHandler);

module.exports = app;

