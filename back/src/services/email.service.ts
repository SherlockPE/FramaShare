import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

/**
 * Sends a password reset email to the user.
 * @param to The recipient's email address
 * @param resetLink The unique link for the user to reset their password
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const mailOptions = {
    from: process.env.FROM_EMAIL || '"FramaShare" <noreply@framashare.local>',
    to,
    subject: 'Recuperación de contraseña - FramaShare',
    text: `Has solicitado restablecer tu contraseña.\n\nHaz clic en el siguiente enlace para crear una nueva:\n${resetLink}\n\nSi no fuiste tú, ignora este mensaje.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333;">Recuperación de contraseña</h2>
        <p>Has solicitado restablecer tu contraseña en <strong>FramaShare</strong>.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Restablecer contraseña</a>
        </p>
        <p>Si tienes problemas con el botón, copia y pega esta URL en tu navegador:</p>
        <p style="word-break: break-all; color: #555;"><small>${resetLink}</small></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">Si no fuiste tú, puedes ignorar este mensaje sin problema.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send password reset email');
  }
}
