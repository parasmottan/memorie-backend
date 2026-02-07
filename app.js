import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import otpRoute from './routes/otpRoute.js';
import cookieParser from 'cookie-parser';
import memoryRoutes from "./routes/memory.js";

dotenv.config();

const app = express();

/* ======================
   🔌 MIDDLEWARE (ORDER MATTERS)
====================== */
app.use(cookieParser());
app.use(express.json({ limit: '30mb' }));

/* ======================
   🌐 CORS (SIMPLE & SAFE)
====================== */
app.use(cors({
  origin: true,              // 🔥 allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 🔥 Preflight (OPTIONS) – MUST
app.options('*', cors());

/* ======================
   🟢 MONGODB (NON-BLOCKING)
====================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err =>
    console.error('❌ MongoDB connection error:', err.message)
  );

/* ======================
   🔗 ROUTES
====================== */
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoute);
app.use('/api/memory', memoryRoutes);

export default app;
