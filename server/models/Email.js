import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  recipient: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'failed'],
    default: 'draft'
  },
  sentAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
emailSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Email = mongoose.model('Email', emailSchema);

export default Email;