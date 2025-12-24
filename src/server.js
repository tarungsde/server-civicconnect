import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/report.js';

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => res.json('App is running.'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Civic Issues API is running' });
});

const PORT = process.env.PORT;

app.listen(PORT, (req, res) =>{
  res.json({ status: 'OK', message: 'Civic Issues API is running' });
  console.log(`App is running on port http://localhost:${PORT}.`);
});