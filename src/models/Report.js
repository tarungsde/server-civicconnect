import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['pothole', 'garbage', 'streetlight', 'water', 'traffic', 'other'],
      default: 'other'
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reporterEmail: String,
    reporterName: String,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved', 'rejected'],
      default: 'pending'
    },
    photos: [String], // Array of image URLs
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: "Reports"
  }
);

export default mongoose.model('Report', reportSchema);