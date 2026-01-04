// scripts/createAdmin.js (run once)
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const promoteToAdmin = async (email) => {
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log(`✅ ${email} promoted to admin`);
    } else {
      console.log(`❌ User with email ${email} not found`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run for specific emails
promoteToAdmin('tarunkumarg2004@gmail.com');