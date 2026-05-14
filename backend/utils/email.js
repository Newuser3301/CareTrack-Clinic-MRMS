const nodemailer = require('nodemailer');

const hasSmtpConfig = () => process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS;

const sendPasswordResetEmail = async ({ to, resetUrl, resetToken }) => {
  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Password reset token for ${to}: ${resetToken}`);
      console.log(`Password reset URL for ${to}: ${resetUrl}`);
      return;
    }
    throw new Error('SMTP is not configured for password reset emails');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'CareTrack Clinic <no-reply@caretrack.local>',
    to,
    subject: 'CareTrack password reset',
    text: `Use this link to reset your password: ${resetUrl}\n\nThis link expires soon.`,
    html: `<p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires soon.</p>`
  });
};

module.exports = { sendPasswordResetEmail };
