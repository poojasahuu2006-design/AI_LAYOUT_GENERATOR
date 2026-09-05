const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  profileImage: {
    type: String,
    default: ''
  },
  unitPreference: {
    type: String,
    enum: ['ft', 'm'],
    default: 'ft'
  },
  defaultFloorView: {
    type: String,
    default: 'both'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
