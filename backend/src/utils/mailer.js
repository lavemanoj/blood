const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password (not your real password)
  }
});

exports.sendOTPEmail = async (to, otp) => {
  try {
    await transporter.sendMail({
      from: `"Hemora 🩸" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Your Hemora Verification Code',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:48px;">🩸</span>
            <h1 style="color:#fff;font-size:24px;margin:12px 0 4px;">Hemora</h1>
            <p style="color:rgba(255,255,255,0.4);font-size:14px;">Email Verification</p>
          </div>
          <p style="color:rgba(255,255,255,0.7);font-size:15px;margin-bottom:24px;">
            Use the code below to verify your email address. It expires in <strong style="color:#ff2d55;">10 minutes</strong>.
          </p>
          <div style="background:rgba(255,45,85,0.1);border:1px solid rgba(255,45,85,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#ff2d55;">${otp}</span>
          </div>
          <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `
    });
    console.log(`OTP email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
    throw err;
  }
};
