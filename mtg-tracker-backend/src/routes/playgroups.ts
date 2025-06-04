import { Router, Request as ExpressRequest, Response, NextFunction, RequestHandler } from 'express';
import { auth } from '../middleware/auth';
import Playgroup from '../models/Playgroup';
import User from '../models/User';
import mongoose from 'mongoose';

// Extended request interface with userId
interface AuthRequest extends ExpressRequest {
  userId?: string;
}

const router = Router();

// Create a new playgroup
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
const createPlaygroup: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, password, confirmPassword, isPrivate } = req.body;
    
    if (!req.userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ message: 'Playgroup name is required and must be a non-empty string' });
      return;
    }

    // Check if playgroup name already exists
    const existingPlaygroup = await Playgroup.findOne({ name: name.trim() });
    if (existingPlaygroup) {
      res.status(400).json({ message: 'Playgroup name already exists' });
      return;
    }

    // Validate password confirmation for private playgroups
    if (isPrivate) {
      if (!password) {
        res.status(400).json({ message: 'Password is required for private playgroups' });
        return;
      }
      if (password !== confirmPassword) {
        res.status(400).json({ message: 'Passwords do not match' });
        return;
      }
    }

    const playgroup = new Playgroup({
      name: name.trim(),
      members: [new mongoose.Types.ObjectId(req.userId)],
      createdBy: new mongoose.Types.ObjectId(req.userId),
      password: isPrivate ? password : undefined,
      isPrivate: isPrivate || false
    });

    await playgroup.save();
    res.status(201).json(playgroup);
  } catch (error) {
    next(error);
  }
};

// Get all playgroups
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
const getAllPlaygroups: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const playgroups = await Playgroup.find()
      .populate('members', 'username')
      .populate('createdBy', 'username');
    res.json(playgroups);
  } catch (error) {
    next(error);
  }
};

// Join a playgroup
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
const joinPlaygroup: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const { password } = req.body;
    const playgroup = await Playgroup.findById(req.params.id);
    
    if (!playgroup) {
      res.status(404).json({ message: 'Playgroup not found' });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.userId);

    if (playgroup.isPrivate) {
      if (!password) {
        res.status(400).json({ message: 'Password required for private playgroup' });
        return;
      }
      if (password !== playgroup.password) {
        res.status(401).json({ message: 'Incorrect password' });
        return;
      }
    }

    if (playgroup.members.some(member => member.equals(userId))) {
      res.status(400).json({ message: 'Already a member of this playgroup' });
      return;
    }

    playgroup.members.push(userId);
    await playgroup.save();
    res.json(playgroup);
  } catch (error) {
    next(error);
  }
};

// Leave a playgroup
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
const leavePlaygroup: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const playgroup = await Playgroup.findById(req.params.id);
    if (!playgroup) {
      res.status(404).json({ message: 'Playgroup not found' });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.userId);
    
    // Check if user is the owner
    if (playgroup.createdBy.equals(userId)) {
      res.status(403).json({ message: 'The playgroup owner cannot leave the playgroup' });
      return;
    }

    // Check if user is a member
    if (!playgroup.members.some(member => member.equals(userId))) {
      res.status(400).json({ message: 'Not a member of this playgroup' });
      return;
    }

    // Remove user from members array
    playgroup.members = playgroup.members.filter(memberId => !memberId.equals(userId));
    await playgroup.save();

    res.json(playgroup);
  } catch (error) {
    next(error);
  }
};

// Get playgroup members
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
const getPlaygroupMembers: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const playgroup = await Playgroup.findById(req.params.id)
      .populate('members', 'username')
      .populate('createdBy', 'username');
    
    if (!playgroup) {
      res.status(404).json({ message: 'Playgroup not found' });
      return;
    }

    // Extract usernames from populated members
    const memberUsernames = playgroup.members
      .filter(member => member && typeof member === 'object' && 'username' in member)
      .map(member => (member as any).username);

    // Add creator's username if not already in the list
    const creatorUsername = (playgroup.createdBy as any)?.username;
    if (creatorUsername && !memberUsernames.includes(creatorUsername)) {
      memberUsernames.unshift(creatorUsername);
    }

    res.json(memberUsernames);
  } catch (error) {
    next(error);
  }
};

// Kick a member from a playgroup
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
const kickMember: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const { memberUsername } = req.body;
    const playgroup = await Playgroup.findById(req.params.id)
      .populate('members', 'username')
      .populate('createdBy', 'username');

    if (!playgroup) {
      res.status(404).json({ message: 'Playgroup not found' });
      return;
    }

    // Check if the requesting user is the creator
    const creatorId = (playgroup.createdBy as any)._id.toString();
    if (creatorId !== req.userId) {
      res.status(403).json({ message: 'Only the playgroup creator can kick members' });
      return;
    }

    // Find the member to kick
    const memberToKick = await User.findOne({ username: memberUsername });
    if (!memberToKick) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    // Don't allow kicking the creator
    const memberId = (memberToKick as any)._id.toString();
    if (memberId === creatorId) {
      res.status(400).json({ message: 'Cannot kick the playgroup creator' });
      return;
    }

    // Remove the member from the playgroup
    playgroup.members = playgroup.members.filter(
      (member: any) => member.username !== memberUsername
    );
    await playgroup.save();

    // Return updated playgroup with populated members
    const updatedPlaygroup = await Playgroup.findById(req.params.id)
      .populate('members', 'username')
      .populate('createdBy', 'username');

    res.json(updatedPlaygroup);
  } catch (error) {
    next(error);
  }
};

// Delete a playgroup
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
const deletePlaygroup: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'User ID not found' });
      return;
    }

    const playgroup = await Playgroup.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!playgroup) {
      res.status(404).json({ message: 'Playgroup not found' });
      return;
    }

    // Check if the requesting user is the creator
    const creatorId = (playgroup.createdBy as any)._id.toString();
    if (creatorId !== req.userId) {
      res.status(403).json({ message: 'Only the playgroup creator can delete the playgroup' });
      return;
    }

    await Playgroup.findByIdAndDelete(req.params.id);
    res.json({ message: 'Playgroup deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.post('/', auth, createPlaygroup);
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.get('/', auth, getAllPlaygroups);
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.post('/:id/join', auth, joinPlaygroup);
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.post('/:id/leave', auth, leavePlaygroup);
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.get('/:id/members', auth, getPlaygroupMembers);
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.post('/:id/kick', auth, kickMember);
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.delete('/:id', auth, deletePlaygroup);

export default router; 