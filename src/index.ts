import express from 'express';
import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import shopsRoutes from './routes/shops';
import productsRoutes from './routes/products';
import wishesRoutes from './routes/wishes';
import tripsRoutes from './routes/trips';
import notificationsRoutes from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/users', usersRoutes);
app.use('/v1/shops', shopsRoutes);
app.use('/v1/products', productsRoutes);
app.use('/v1/wishes', wishesRoutes);
app.use('/v1/trips', tripsRoutes);
app.use('/v1/notifications', notificationsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (last)
app.use(errorHandler);

// Initialize database and start server
async function main() {
  try {
    await AppDataSource.initialize();
    console.log('✓ Database connected');

    app.listen(PORT, () => {
      console.log(`✓ Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  }
}

main();
