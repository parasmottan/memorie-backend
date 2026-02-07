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

// 🔌 Middleware (ORDER MATTERS)
app.use(cookieParser());

app.use(express.json({ limit: '30mb' }));

app.use(cors({
  origin: function (origin, callback) {
    // allow server-to-server & Postman
    if (!origin) return callback(null, true);

    // allow all Vercel preview + prod
    if (
      origin.endsWith('.vercel.app') ||
      origin === 'http://localhost:5173'
    ) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Preflight fix
app.options('*', cors());

// 🟢 MongoDB Connection (non-blocking)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) =>
    console.error("❌ MongoDB connection error:", err.message)
  );

// 🔗 Routes (CONSISTENT PREFIX)
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoute);
app.use('/api/memory', memoryRoutes);

export default app;
