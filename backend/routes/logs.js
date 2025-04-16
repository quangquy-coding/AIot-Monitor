import express from 'express';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();

// Get all logs (admin, team_lead only)
router.get('/', async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'team_lead'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { page = 1, limit = 50, user, action, target, status, startDate, endDate } = req.query;
    
    // Build query
    const query = {};
    if (user) query.user = user;
    if (action) query.action = action;
    if (target) query.target = target;
    if (status) query.status = status;
    
    // Date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Execute query with pagination
    const logs = await ActivityLog.find(query)
      .populate('user', 'username role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await ActivityLog.countDocuments(query);
    
    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;