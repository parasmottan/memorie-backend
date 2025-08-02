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



app.use(cookieParser())

// 🟢 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

// Middleware
app.use(cors({
  origin: ['https://memorie-amber.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '30mb' }));

// Routes
app.use('/auth', authRoutes);
app.use('/otp', otpRoute);
app.use("/api/memory", memoryRoutes);
// app.use("/api", memoryRoutes);




export default app;
