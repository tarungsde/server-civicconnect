import express from 'express';
import isAdmin from '../middleware/admin.js';
import Report from '../models/Report.js';
import { sendStatusUpdateEmail } from '../scripts/mailSender.js';

const router = express.Router();

// Get all reports (admin view with filters)
router.get('/reports', isAdmin, async (req, res) => {
  try {
    const { 
      status,
      category, 
      dateFrom, 
      dateTo,
      page = 1,
      limit = 50 
    } = req.query;
    
    const query = {};
    
    // Admin filters
    if (status) {
      if (status.startsWith('!')) {
        // Negative filter: status not equal to
        query.status = { $ne: status.substring(1) };
      } else {
        query.status = status;
      }
    }
    if (category) query.category = category;
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    const reports = await Report.find(query)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Report.countDocuments(query);
    
    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Admin reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Update report status
router.patch('/reports/:id/status', isAdmin, async (req, res) => {
  try {
    let { status, adminNotes } = req.body;
    if(!adminNotes) adminNotes = '';
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Add to report history
    report.statusHistory = report.statusHistory || [];
    report.statusHistory.push({
      status: status,
      changedBy: req.userId,
      changedAt: new Date(),
      notes: adminNotes
    });
    
    // Update status
    report.status = status;
    report.updatedAt = new Date();
    report.updatedBy = req.userId;
    
    await report.save();

    if (report.reportedBy && report.reporterEmail) {
      try {
        await sendStatusUpdateEmail(
          report.reporterEmail,
          report.reporterName,
          report,
          adminNotes
        );
        console.log(`Status update email sent to ${report.reporterEmail}`);
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }
    
    res.json({ 
      message: 'Status updated successfully',
      report 
    });
    
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Get statistics dashboard
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const [statusStats, categoryStats, urgencyStats] = await Promise.all([
      // Status distribution
      Report.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Category distribution
      Report.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      
      // Urgency distribution
      Report.aggregate([
        { $group: { _id: '$urgency', count: { $sum: 1 } } }
      ]),
    ]);
    
    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentActivity = await Report.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      statusStats,
      categoryStats,
      urgencyStats,
      recentActivity,
      totalReports: await Report.countDocuments()
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;