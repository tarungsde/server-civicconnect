import express from 'express';
import authenticate from '../middleware/auth.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

const router = express.Router();

// Create a new report
router.post('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const report = new Report({
      ...req.body,
      reportedBy: req.userId,
      reporterEmail: user.email,
      reporterName: user.name
    });

    await report.save();
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Get user's reports
router.get('/my-reports', authenticate, async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: req.userId })
      .sort({ createdAt: -1 });
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get all reports (for map display)
router.get('/', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;
    
    let query = {};
    
    // If coordinates provided, filter by location
    if (latitude && longitude) {
      query = {
        latitude: { 
          $gte: parseFloat(latitude) - 0.1, 
          $lte: parseFloat(latitude) + 0.1 
        },
        longitude: { 
          $gte: parseFloat(longitude) - 0.1, 
          $lte: parseFloat(longitude) + 0.1 
        }
      };
    }
    
    const reports = await Report.find(query)
      .populate('reportedBy', 'name picture')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({ reports });
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.reportedBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this report' });
    }

    const allowedUpdates = ['title', 'description', 'category', 'urgency'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        report[field] = req.body[field];
      }
    });

    report.updatedAt = new Date();
    await report.save();
    
    res.json({ 
      message: 'Report updated successfully', 
      report 
    });

  } catch (error) {
    console.error('Report update error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
})

// Update report status (admin feature for later)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    report.status = req.body.status;
    report.updatedAt = new Date();
    await report.save();
    
    res.json({ message: 'Report status updated', report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

export default router;