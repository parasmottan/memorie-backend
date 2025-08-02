import transporter from '../config/mailer.js';
import { generateOTP } from '../utils/otpGenerator.js';
import Otp from '../models/otpModel.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// ------------------ SEND OTP ------------------
export const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const otp = generateOTP();

  const mailOptions = {
    from: '"Memorie - Memory Board App" <yoursmemorie@gmail.com>',
    to: email,
    subject: "🔐 Verify your Memorie account",
html: `
    <div style="background: #fff8dc; padding: 48px 20px; font-family: 'Segoe UI', sans-serif;">
      <div style="max-width: 460px; background: #fffef0; border: 1px solid #ffe98a; margin: auto; padding: 36px 28px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); text-align: center;">
        
        <img src="https://res.cloudinary.com/dk6fydyjf/image/upload/v1754136009/logois.png" alt="Memorie Logo" style="width: 90px; border-radius:100px; margin-bottom: 24px; display: block; margin-left: auto; margin-right: auto;" />

        <h2 style="font-size: 24px; color: #d99200; margin-bottom: 8px;">Verify Your Email 💌</h2>
        <p style="font-size: 15px; color: #444; margin-bottom: 30px;">
          You're almost in! Use the OTP below to unlock your digital memory wall.
        </p>

        <div style="background: #fff3bf; display: inline-block; padding: 16px 32px; border-radius: 14px; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d99200;">
            ${otp}
          </span>
        </div>

        <p style="font-size: 13.5px; color: #777; margin-top: 12px;">
          This OTP is valid for 10 minutes. Please do not share it with anyone. 🕒
        </p>

        <div style="margin-top: 40px;">
          <p style="font-size: 13px; color: #aaa;">
            Yours lovingly,<br />
            <strong style="color: #d99200;">Team Memorie 💛</strong><br />
            <em>Your memory saver ✨</em>
          </p>
        </div>
      </div>
    </div>
  `


  };

  try {
    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}: ${otp}`);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error("❌ Failed to send OTP:", error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};


// ------------------ VERIFY OTP ------------------
export const verifyOtp = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  try {
    const otpEntry = await Otp.findOne({ otp });
    if (!otpEntry) return res.status(400).json({ message: "Invalid OTP" });

    if (otpEntry.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpEntry._id });
      return res.status(400).json({ message: "OTP has expired" });
    }

    const user = await User.findOne({ email: otpEntry.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isVerified = true;
    await user.save();

    await Otp.deleteOne({ _id: otpEntry._id });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // ------------------ WELCOME MAIL ------------------
    const welcomeMail = {
      from: '"Memorie - Memory Board App" <yoursmemorie@gmail.com>',
      to: user.email,
      subject: `Welcome to Memorie, ${user.username || 'Friend'} 💞`,
html: `
    <div style="background: #fffbe6; padding: 48px 20px; font-family: 'Segoe UI', sans-serif;">
      <div style="max-width: 480px; background: #fffcf0; border: 1px solid #ffe580; margin: auto; padding: 36px 28px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); text-align: center;">
        
        <img src="https://res.cloudinary.com/dk6fydyjf/image/upload/v1754136009/logois.png" alt="Memorie Logo" style="width: 80px; border-radius: 100px; margin-bottom: 24px; display: block; margin-left: auto; margin-right: auto;" />

        <h2 style="font-size: 26px; color: #c48a00; margin-bottom: 10px;">Welcome to Memorie 💖</h2>
        <p style="font-size: 15px; color: #555;">We're so happy you're here, ${user.username || 'dear friend'}.</p>

        <div style="margin-top: 24px; background: #fff; padding: 20px; border-radius: 16px; border: 1px solid #fff2b3;">
          <p style="font-size: 14.5px; color: #666;">
            Memorie is your safe space to cherish every smile, every voice, every memory.
            Start uploading your photos, audios, and unforgettable stories now. 📸🎙️
          </p>
          <div style="margin-top: 22px;">
            <a href="https://yourmemorie.app/home" style="display: inline-block; background: #f7c942; color: white; padding: 12px 28px; border-radius: 30px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 10px rgba(0,0,0,0.12);">
              ➕ Create Your First Memory
            </a>
          </div>
        </div>

        <p style="margin-top: 30px; font-size: 13px; color: #999;">
          Yours forever,<br />
          — Team Memorie 💛<br />
          <em>Your memory saver ✨</em>
        </p>
      </div>
    </div>
  `


    };

    try {
      await transporter.sendMail(welcomeMail);
      console.log(`📩 Welcome mail sent to ${user.email}`);
    } catch (mailErr) {
      console.error("❌ Failed to send welcome mail:", mailErr.message);
    }

    // ------------------ RESPONSE ------------------
    res
      .cookie("token", token, {
        httpOnly: false,
        secure: true,
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        message: "OTP verified successfully",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
        },
        token
      });

  } catch (err) {
    console.error("❌ OTP verification failed:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// ------------------ GET USER FROM COOKIE ------------------
export const getUserFromCookie = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    return res.status(401).json({ message: "Token invalid" });
  }
};
