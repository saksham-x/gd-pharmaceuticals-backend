// Must stay first: registers mongoose plugins before any model is compiled.
import './config/mongoosePlugins.js';
import cors from 'cors';
import express, { type Express } from 'express';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { router } from './routes.js';
import { ApiError } from './utils/ApiError.js';

export const app: Express = express();

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  ...config.corsOrigins,
]);

app.disable('x-powered-by');
app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header: Postman, curl, server-to-server.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(ApiError.forbidden(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({ message: 'G.D. Pharmaceuticals API running', environment: config.env });
});

app.use('/api', router);

app.use((req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);
