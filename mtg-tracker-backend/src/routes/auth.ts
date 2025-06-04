import express, { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const router = express.Router();

// Register
const register: RequestHandler = async (req, res): Promise<void> => {
  try {
    console.log('Registration attempt:', { username: req.body.username });
    
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      console.log('Missing required fields:', { username: !!username, password: !!password });
      res.status(400).json({ 
        message: 'Username and password are required',
        details: {
          username: !username ? 'Username is required' : undefined,
          password: !password ? 'Password is required' : undefined
        }
      });
      return;
    }

    // Validate username length
    if (username.length < 3) {
      res.status(400).json({ 
        message: 'Username must be at least 3 characters long'
      });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({ 
        message: 'Password must be at least 6 characters long'
      });
      return;
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Username already exists:', username);
      res.status(400).json({ message: 'Username already exists' });
      return;
    }
    
    // Create new user
    const user = new User({ 
      username: username.trim(),
      password 
    });

    console.log('Attempting to save user:', { username: user.username });
    
    // Save user and handle validation errors
    try {
      await user.save();
      console.log('User saved successfully:', { userId: user._id, username: user.username });
    } catch (validationError: any) {
      console.error('Validation error:', validationError);
      if (validationError.name === 'ValidationError') {
        const errors = Object.values(validationError.errors).map((err: any) => err.message);
        res.status(400).json({ 
          message: 'Validation failed',
          details: errors
        });
        return;
      }
      throw validationError;
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Login
const login: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    
    // Check password
    const isMatch = await (user as IUser).comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

router.post('/register', register);
router.post('/login', login);

export default router; 