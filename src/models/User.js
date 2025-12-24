import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    name: {
      type: String,
      required: true
    },
    picture: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  },
  {  
    collection: "Users"
  }
);

export default mongoose.model('User', userSchema);