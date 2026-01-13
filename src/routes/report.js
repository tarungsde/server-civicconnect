import express from 'express';
import multer from 'multer';
import cloudinary from 'cloudinary';
import authenticate from '../middleware/auth.js';
import Report from '../models/Report.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

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

const transporter = nodemailer.createTransport({
  secure: true,
  host: 'smtp.gmail.com',
  port: 465,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  }
});

const sendConfirmationEmail = async (email, name, report) => {
  const mailOptions = {
    from: `"Civic Connect" <${process.env.NODEMAILER_USER}>`,
    to: email,
    subject: 'Your Civic Issue Report Has Been Submitted',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .status-badge { display: inline-block; padding: 5px 10px; background: #ffc107; color: #856404; border-radius: 20px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Civic Connect</h1>
            <h2>Report Confirmation</h2>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Thank you for reporting an issue in your community. Your report has been successfully submitted and is now under review.</p>
            
            <div class="details">
              <h3>📋 Report Details</h3>
              <p><strong>Report ID:</strong> ${report._id}</p>
              <p><strong>Title:</strong> ${report.title}</p>
              <p><strong>Category:</strong> ${report.category}</p>
              <p><strong>Urgency:</strong> ${report.urgency}</p>
              <p><strong>Status:</strong> <span class="status-badge">${report.status}</span></p>
              <p><strong>Location:</strong> ${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}</p>
              <p><strong>Submitted:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Your report will be reviewed by concerned authority</li>
              <li>You'll receive updates when the status changes</li>
              <li>Other citizens can upvote your report to increase visibility</li>
            </ul>
            
            <p>You can track your report's status by logging into your Civic Connect account.</p>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Civic Connect. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    // Optional: Text version for email clients that don't support HTML
    text: `
      Civic Connect - Report Confirmation
      
      Hello ${name},
      
      Thank you for reporting an issue in your community. Your report has been successfully submitted.
      
      Report Details:
      - Report ID: ${report._id}
      - Title: ${report.title}
      - Category: ${report.category}
      - Urgency: ${report.urgency}
      - Status: ${report.status}
      - Location: ${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}
      - Submitted: ${new Date(report.createdAt).toLocaleString()}
      
      What happens next?
      1. Your report will be reviewed by concerned authority
      2. You'll receive updates when the status changes
      3. Other citizens can upvote your report
      
      Track your report's status by logging into your Civic Connect account.
      
      This is an automated message. Please do not reply.
    `
  };

  return transporter.sendMail(mailOptions);
};


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

    try {
      await sendConfirmationEmail(user.email, user.name, report);
    } catch (error) {
      console.error('Email sending failed but report saved:', emailError);
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

    console.log(req.query);

    const { 
      status,
      category, 
      dateFrom, 
      dateTo,
      page = 1,
      limit = 50 
    } = req.query;
    
    if (status) query.status = status;
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
      .select('title description category urgency latitude longitude photos status createdAt upvoteCount')
      .sort({ upvoteCount: -1, createdAt: -1 }) // Sort by upvotes first
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