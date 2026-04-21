import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'VibesChat <noreply@vibeschat.com>',
    to,
    subject,
    html,
  });
};

export const sendOTPEmail = async (to: string, otp: string): Promise<void> => {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0f0f0f; border-radius: 16px; color: #fff;">
      <h1 style="color: #7c3aed; margin-bottom: 8px;">VibesChat</h1>
      <p style="color: #a1a1aa;">Your verification code:</p>
      <div style="background: #1c1c1e; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #7c3aed;">${otp}</span>
      </div>
      <p style="color: #71717a; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
  `;
  await sendEmail(to, 'VibesChat – Email Verification', html);
};

export const sendPasswordResetEmail = async (to: string, resetUrl: string): Promise<void> => {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0f0f0f; border-radius: 16px; color: #fff;">
      <h1 style="color: #7c3aed; margin-bottom: 8px;">VibesChat</h1>
      <p style="color: #a1a1aa;">You requested a password reset.</p>
      <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600;">Reset Password</a>
      <p style="color: #71717a; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `;
  await sendEmail(to, 'VibesChat – Password Reset', html);
};
