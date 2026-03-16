const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  email: {
    type: String,
    unique: true,
    sparse: true,   // allows multiple docs with no email (Google-only users)
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    default: null   // null for Google-only accounts
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String,
    default: null   // Google profile picture URL
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
