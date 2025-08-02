import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ------------------ REGISTER ------------------
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      isVerified: false, // 🔐 Important line
    });

    // Optionally send OTP here if needed

    res.status(201).json({
      message: "User registered. OTP sent to your email.",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.log("Register Error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};


// ------------------ LOGIN ------------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email with OTP before logging in." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

  res
  .cookie("token", token, {
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  .status(200)
  .json({
    message: "Login successful",
    token, // ✅ ADD THIS LINE
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
  });

  } catch (err) {
    console.log("Login Error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};


export const getMe = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      user,
      token, // ✅ token also returned
    });

  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};