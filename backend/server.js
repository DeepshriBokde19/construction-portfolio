
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

app.use(express.json());

app.use("/api/contact", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5
}));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (![name, email, phone, message].every(
      value => typeof value === "string" && value.trim()
    )) {
      return res.status(400).json({
        message: "Please fill all fields."
      });
    }

    if (name.length > 100 || email.length > 254 ||
        phone.length > 30 || message.length > 5000) {
      return res.status(400).json({
        message: "One or more fields are too long."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Invalid email address."
      });
    }

    await transporter.sendMail({
      from: `"Construction Website" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email,
      subject: `New enquiry from ${name.trim()}`,
      text: `Name: ${name}
Email: ${email}
Phone: ${phone}

Message:
${message}`
    });

    res.json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Email error:", error.message);
    res.status(500).json({
      message: "Email could not be sent."
    });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Backend running on port 5000");
});
