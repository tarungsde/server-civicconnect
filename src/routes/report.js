import express from 'express';
import multer from 'multer';
import cloudinary from 'cloudinary';
import authenticate from '../middleware/auth.js';
import Report from '../models/Report.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import NodeGeoCoder from 'node-geocoder';
import { sendConfirmationEmail } from '../scripts/mailSender.js';

dotenv.config();

const router = express.Router();
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024}
});

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const options = {
  provider: 'openstreetmap',
  formatter: null,
  language: 'en',
}

const geocoder = NodeGeoCoder(options);

const reverseGeocode = async (latitude, longitude) => {
  try {
    const res = await geocoder.reverse({ lat: latitude, lon: longitude });
    if (res.length === 0) {
      console.log('No address found');
      return null;
    }
    return res[0].formattedAddress;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Create a new report
router.post('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const fetchedAddress = await reverseGeocode(req.body.latitude, req.body.longitude);
    const report = new Report({
      ...req.body,
      reportedBy: req.userId,
      reporterEmail: user.email,
      reporterName: user.name,
      address: fetchedAddress,
    });

    await report.save();

    try {
      await sendConfirmationEmail(user.email, user.name, report);
    } catch (error) {
      console.error('Email sending failed but report saved:', error);
    }

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
    // const { latitude, longitude, radius = 5000 } = req.query;
    // const { latitude, longitude } = req.query;
    let query = {};
    
    // // If coordinates provided, filter by location
    // if (latitude && longitude) {
    //   query = {
    //     latitude: { 
    //       $gte: parseFloat(latitude) - 0.1, 
    //       $lte: parseFloat(latitude) + 0.1 
    //     },
    //     longitude: { 
    //       $gte: parseFloat(longitude) - 0.1, 
    //       $lte: parseFloat(longitude) + 0.1 
    //     }
    //   };
    // }

    const { 
      status,
      category, 
      dateFrom, 
      dateTo,
      page = 1,
      limit = 50 
    } = req.query;
    
    if (status === '') {}
    else if (status) query.status = status;
    else query.status = { $in: ['Pending', 'In-progress'] };

    if (category) query.category = category;
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const reports = await Report.find(query)
      .populate('reportedBy', 'name picture')
      .select('title description category urgency latitude longitude address photos status createdAt upvoteCount')
      // .sort({ upvoteCount: -1, createdAt: -1 }) // Sort by upvotes first
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

// Image upload endpoint
router.post('/upload', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const urls = [];
    
    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream(
          {
            folder: 'civic-issues',
            resource_type: 'auto'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file.buffer);
      });
      
      urls.push(result.secure_url);
    }
    
    res.json({ urls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Upvote a report
router.post('/:id/upvote', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const alreadyUpvoted = report.upvotes.includes(req.userId);

    if (alreadyUpvoted) {
      report.upvotes = report.upvotes.filter(
        userId => userId.toString() !== req.userId
      );
    
      report.upvoteCount = Math.max(0, report.upvoteCount - 1);
      await report.save();

      return res.json({ 
        message: 'Upvote removed', 
        upvoted: false,
        upvoteCount: report.upvoteCount 
      });
    }

    report.upvotes.push(req.userId);
    report.upvoteCount += 1;
    await report.save();
    
    res.json({ 
      message: 'Report upvoted', 
      upvoted: true,
      upvoteCount: report.upvoteCount 
    });    

  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ error: 'Failed to upvote report' });
  }
});

router.get('/:id/upvote/check', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const hasUpvoted = report.upvotes.some(
      userId => userId.toString() === req.userId
    );
    
    res.json({ upvoted: hasUpvoted });
    
  } catch (error) {
    console.error('Check upvote error:', error);
    res.status(500).json({ error: 'Failed to check upvote status' });
  }
});

export default router;