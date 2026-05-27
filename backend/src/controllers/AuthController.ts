import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';

class AuthController {
  async register(req: AuthRequest, res: Response) {
    try {
      const { username, email, password, confirmPassword, full_name } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required',
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match',
        });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
        });
      }

      const user = await User.create({
        username,
        email,
        password,
        full_name: full_name || '',
        role: 'user',
        is_active: true,
      });

      const signOptions: any = {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      };

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        (process.env.JWT_SECRET || 'secret') as string,
        signOptions
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user_id: user.id,
          username: user.username,
          email: user.email,
          token,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
      });
    }
  }

  async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive',
        });
      }

      const signOptions: any = {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      };

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        (process.env.JWT_SECRET || 'secret') as string,
        signOptions
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user_id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
      });
    }
  }

  async me(req: AuthRequest, res: Response) {
    try {
      const user = await User.findByPk(req.user?.id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user info',
      });
    }
  }
}

export default new AuthController();
