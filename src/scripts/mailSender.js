import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const transporter = nodemailer.createTransport({
  secure: true,
  host: 'smtp.gmail.com',
  port: 465,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  }
});

export const sendConfirmationEmail = async (email, name, report) => {
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

export const sendStatusUpdateEmail = async (email, name, report, adminNotes = '') => {
  const statusMessages = {
    'Pending': {
      subject: '📋 Your Report is Under Review',
      message: 'is now pending review by our team',
      badgeColor: '#ffc107',
      textColor: '#856404'
    },
    'In-progress': {
      subject: '🚧 Action Taken on Your Report',
      message: 'is now being addressed by the concerned authorities',
      badgeColor: '#17a2b8',
      textColor: '#0c5460'
    },
    'Resolved': {
      subject: '✅ Your Report Has Been Resolved!',
      message: 'has been successfully resolved',
      badgeColor: '#28a745',
      textColor: '#155724'
    },
    'Rejected': {
      subject: '⚠️ Update Regarding Your Report',
      message: 'has been reviewed and marked as inaccurate',
      badgeColor: '#dc3545',
      textColor: '#721c24'
    }
  };

  const statusInfo = statusMessages[report.status] || {
    subject: '📢 Status Update on Your Report',
    message: `has been updated to ${report.status}`,
    badgeColor: '#6c757d',
    textColor: '#383d41'
  };

  const mailOptions = {
    from: `"Civic Connect" <${process.env.NODEMAILER_USER}>`,
    to: email,
    subject: statusInfo.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-change { 
            background: white; 
            padding: 25px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 5px solid ${statusInfo.badgeColor};
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .status-badge { 
            display: inline-block; 
            padding: 8px 16px; 
            background: ${statusInfo.badgeColor}; 
            color: ${statusInfo.textColor}; 
            border-radius: 20px; 
            font-weight: bold;
            font-size: 14px;
            margin: 10px 0;
          }
          .previous-status { color: #6c757d; font-size: 14px; margin-top: 5px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .admin-notes { 
            background: #e9ecef; 
            padding: 15px; 
            border-radius: 6px; 
            margin-top: 15px;
            border-left: 4px solid #6c757d;
          }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px; padding-top: 20px; border-top: 1px solid #dee2e6; }
          .button { 
            display: inline-block; 
            padding: 12px 25px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 15px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Civic Connect</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Status Update Notification</p>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>We have an update regarding the civic issue you reported.</p>
            
            <div class="status-change">
              <h3 style="margin-top: 0; color: #007bff;">📢 Status Update</h3>
              <p>Your report <strong>"${report.title}"</strong> ${statusInfo.message}.</p>
              
              <div>
                <strong>New Status:</strong><br>
                <span class="status-badge">${report.status.toUpperCase()}</span>
              </div>
              
              ${adminNotes ? `
                <div class="admin-notes">
                  <strong>📝 Admin Notes:</strong><br>
                  "${adminNotes}"
                </div>
              ` : ''}
            </div>
            
            <div class="details">
              <h3 style="margin-top: 0; color: #007bff;">📋 Report Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Report ID:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${report._id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Category:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${report.category}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Submitted:</strong></td>
                  <td style="padding: 8px 0;">${new Date(report.createdAt).toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/app" class="button">
                View Report Details
              </a>
            </div>
            
            <p><strong>What this means:</strong></p>
            <ul>
              ${report.status === 'Resolved' ? 
                '<li>The reported issue has been successfully addressed</li>' : 
                report.status === 'In-progress' ? 
                '<li>The concerned authorities are now working on this issue</li>' :
                report.status === 'Rejected' ?
                '<li>After review, this report was found to be inaccurate</li>' :
                '<li>Your report is awaiting review by our team</li>'
              }
              <li>You can check for further updates in your account</li>
              <li>Thank you for helping improve our community!</li>
            </ul>
            
            <div class="footer">
              <p>This is an automated notification. Please do not reply to this email.</p>
              <p>To manage your email preferences, visit your account settings.</p>
              <p>© ${new Date().getFullYear()} Civic Connect. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Civic Connect - Status Update
      
      Hello ${name},
      
      We have an update regarding the civic issue you reported.
      
      STATUS UPDATE:
      Your report "${report.title}" ${statusInfo.message}.
      
      New Status: ${report.status.toUpperCase()}
      ${adminNotes ? `Admin Notes: ${adminNotes}\n` : ''}
      
      REPORT DETAILS:
      - Report ID: ${report._id}
      - Category: ${report.category}
      - Location: ${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}
      - Submitted: ${new Date(report.createdAt).toLocaleString()}
      
      ${report.status === 'Resolved' ? 
        'The reported issue has been successfully addressed.' : 
        report.status === 'In-progress' ? 
        'The concerned authorities are now working on this issue.' :
        report.status === 'Rejected' ?
        'After review, this report was found to be inaccurate.' :
        'Your report is awaiting review by our team.'
      }
      
      View your report details at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/app
      
      Thank you for helping improve our community!
      
      ---
      This is an automated notification. Please do not reply.
      © ${new Date().getFullYear()} Civic Connect
    `
  };

  return transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"Civic Connect" <${process.env.NODEMAILER_USER}>`,
    to: email,
    subject: '🎉 Welcome to Civic Connect!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { 
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white; 
            padding: 40px 20px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
          }
          .welcome-icon { 
            font-size: 48px; 
            margin-bottom: 20px;
            display: block;
          }
          .content { background: #f8f9fa; padding: 40px 30px; border-radius: 0 0 10px 10px; }
          .feature-card { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 15px 0;
            border-left: 4px solid #007bff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          .feature-icon { 
            background: #e7f1ff; 
            color: #007bff; 
            width: 50px; 
            height: 50px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-size: 24px;
            margin-bottom: 15px;
          }
          .button { 
            display: inline-block; 
            padding: 14px 30px; 
            background: #28a745; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 3px 10px rgba(40, 167, 69, 0.3);
          }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); 
            gap: 15px; 
            margin: 25px 0;
          }
          .stat-box { 
            background: white; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          }
          .stat-number { 
            font-size: 24px; 
            font-weight: bold; 
            color: #007bff; 
            margin-bottom: 5px;
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            color: #6c757d; 
            font-size: 13px; 
            padding-top: 20px; 
            border-top: 1px solid #dee2e6; 
          }
          .social-links { margin: 20px 0; }
          .social-icon { 
            display: inline-block; 
            margin: 0 10px; 
            color: #007bff; 
            text-decoration: none;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="welcome-icon">👋</div>
            <h1 style="margin: 0; font-size: 32px;">Welcome to Civic Connect!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Empowering Citizens, Improving Communities</p>
          </div>
          
          <div class="content">
            <p>Hello <strong style="color: #007bff;">${name}</strong>,</p>
            <p>Welcome to Civic Connect! We're excited to have you join our community of citizens working together to make our neighborhoods better.</p>
            
            <h2 style="color: #007bff; margin-top: 30px;">🌟 What You Can Do</h2>
            
            <div class="feature-card">
              <div class="feature-icon">📍</div>
              <h3 style="margin: 0 0 10px 0;">Report Issues</h3>
              <p>Pinpoint problems on the map - potholes, garbage, streetlight issues, and more.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">📈</div>
              <h3 style="margin: 0 0 10px 0;">Track Progress</h3>
              <p>Monitor the status of reported issues from submission to resolution.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">👍</div>
              <h3 style="margin: 0 0 10px 0;">Community Support</h3>
              <p>Upvote important issues to help prioritize community concerns.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/app" class="button">
                🚀 Start Making a Difference
              </a>
            </div>
            
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-number">${process.env.TOTAL_REPORTS || '1000+'}</div>
                <div>Issues Reported</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${process.env.RESOLVED_RATE || '85%'}</div>
                <div>Resolution Rate</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${process.env.ACTIVE_USERS || '500+'}</div>
                <div>Active Citizens</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">24/7</div>
                <div>Monitoring</div>
              </div>
            </div>
            
            <h3 style="color: #007bff; margin-top: 30px;">📋 Quick Start Guide</h3>
            <ol style="background: white; padding: 20px 20px 20px 40px; border-radius: 8px;">
              <li><strong>Explore the map</strong> to see issues in your area</li>
              <li><strong>Click "Report Issue Here"</strong> to submit a new report</li>
              <li><strong>Add photos and details</strong> to help authorities understand</li>
              <li><strong>Track your reports</strong> in your dashboard</li>
              <li><strong>Upvote</strong> important issues in your community</li>
            </ol>
            
            <div class="social-links" style="text-align: center;">
              <p><strong>Connect With Us:</strong></p>
              <a href="#" class="social-icon">📱 Mobile App</a> | 
              <a href="#" class="social-icon">📰 Blog</a> | 
              <a href="#" class="social-icon">🐦 Twitter</a> | 
              <a href="#" class="social-icon">💼 LinkedIn</a>
            </div>
            
            <div class="footer">
              <p>Need help? <a href="mailto:support@civicconnect.com" style="color: #007bff;">Contact our support team</a></p>
              <p>You're receiving this email because you signed up for Civic Connect.</p>
              <p style="font-size: 12px; margin-top: 10px;">
                Civic Connect | 123 Community Street, Cityville, ST 12345<br>
                © ${new Date().getFullYear()} Civic Connect. Making communities better, together.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      🎉 Welcome to Civic Connect!
      
      Hello ${name},
      
      Welcome to Civic Connect! We're excited to have you join our community of citizens working together to make our neighborhoods better.
      
      EMPOWERING CITIZENS, IMPROVING COMMUNITIES
      
      WHAT YOU CAN DO:
      
      1. 📍 REPORT ISSUES
         Pinpoint problems on the map - potholes, garbage, streetlight issues, and more.
      
      2. 📈 TRACK PROGRESS
         Monitor the status of reported issues from submission to resolution.
      
      3. 👍 COMMUNITY SUPPORT
         Upvote important issues to help prioritize community concerns.
      
      QUICK START GUIDE:
      1. Explore the map to see issues in your area
      2. Click "Report Issue Here" to submit a new report
      3. Add photos and details to help authorities understand
      4. Track your reports in your dashboard
      5. Upvote important issues in your community
      
      Get started now: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/app
      
      STATS:
      - ${process.env.TOTAL_REPORTS || '1000+'} Issues Reported
      - ${process.env.RESOLVED_RATE || '85%'} Resolution Rate
      - ${process.env.ACTIVE_USERS || '500+'} Active Citizens
      - 24/7 Monitoring
      
      Need help? Contact our support team: support@civicconnect.com
      
      Connect with us:
      📱 Mobile App | 📰 Blog | 🐦 Twitter | 💼 LinkedIn
      
      ---
      Civic Connect | 123 Community Street, Cityville, ST 12345
      © ${new Date().getFullYear()} Civic Connect. Making communities better, together.
      
      You're receiving this email because you signed up for Civic Connect.
    `
  };

  return transporter.sendMail(mailOptions);
};

// export default {
//   sendConfirmationEmail,
//   sendStatusUpdateEmail
// };