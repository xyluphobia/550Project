import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import usersRouter from './routes/users.js';
import roomsRouter from './routes/rooms.js';
import equipmentRouter from './routes/equipment.js';
import bookingsRouter from './routes/bookings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());           // Allow frontend requests
app.use(express.json());   // Parse JSON body

// Routes
app.use('/api/users', usersRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/bookings', bookingsRouter);

// Root endpoint for health check
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// Global error handler (optional but useful)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

