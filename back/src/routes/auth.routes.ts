import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../services/password.service.js';
import { sendPasswordResetEmail } from '../services/email.service.js';

// Schemas for validation
const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 }
    }
  }
};

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' }
    }
  }
};

const forgotSchema = {
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' }
    }
  }
};

const resetSchema = {
  body: {
    type: 'object',
    required: ['token', 'newPassword'],
    properties: {
      token: { type: 'string' },
      newPassword: { type: 'string', minLength: 8 }
    }
  }
};

export const authRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {

  server.post('/register', { schema: registerSchema }, async (request, reply) => {
    const { email, password } = request.body as any;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ error: 'Email is already in use' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: email.split('@')[0], // default name
      }
    });

    const token = server.jwt.sign({ id: user.id, email: user.email, role: user.role });
    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return reply.status(201).send({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, quota: user.quota.toString() }
    });
  });

  server.post('/login', { schema: loginSchema }, async (request, reply) => {
    const { email, password } = request.body as any;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = server.jwt.sign({ id: user.id, email: user.email, role: user.role });
    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, quota: user.quota.toString() }
    });
  });

  server.post('/logout', async (request, reply) => {
    reply.clearCookie('token', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return reply.send({ success: true });
  });

  server.get('/me', async (request, reply) => {
    try {
      await request.jwtVerify();
      const payload = request.user as any;
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) return reply.status(404).send({ error: 'User not found' });
      return reply.send({
        user: { id: user.id, email: user.email, name: user.name, role: user.role, quota: user.quota.toString() }
      });
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  server.post('/forgot-password', { schema: forgotSchema }, async (request, reply) => {
    const { email } = request.body as any;

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return a generic message for security
    if (!user) {
      return reply.send({ message: 'If that email exists, we have sent a reset link.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt
      }
    });

    // In a real app, the URL would be dynamic based on origin
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    return reply.send({ message: 'If that email exists, we have sent a reset link.' });
  });

  server.post('/reset-password', { schema: resetSchema }, async (request, reply) => {
    const { token, newPassword } = request.body as any;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!resetTokenRecord || resetTokenRecord.used || resetTokenRecord.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await hashPassword(newPassword);
    
    // Update user and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetTokenRecord.userId },
        data: { passwordHash: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { used: true }
      })
    ]);

    return reply.send({ success: true, message: 'Password has been reset successfully' });
  });
};
