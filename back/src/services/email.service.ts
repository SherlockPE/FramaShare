import nodemailer from 'nodemailer';
export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || '127.0.0.1', port: Number(process.env.SMTP_PORT || 1025),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: process.env.NODE_ENV === 'production' && process.env.SMTP_SECURE !== 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: 10000, socketTimeout: 10000,
  });
  await transport.sendMail({ from: process.env.FROM_EMAIL || 'FramaShare <noreply@framashare.local>', to,
    subject: 'Reset your FramaShare password',
    text: `Use this link within one hour to reset your password:\n${resetLink}\nIf you did not request this, ignore this message.`,
  });
}
