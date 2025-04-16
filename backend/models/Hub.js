import mongoose from 'mongoose';

const hubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['master', 'garage', 'alarm', 'upstairs', 'downstairs', 'power', 'irrigation'],
    required: true
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  macAddress: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance', 'error'],
    default: 'offline'
  },
  lastPing: {
    type: Date
  },
  parentHub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub'
  },
  customer: {
    name: String,
    id: String,
    type: {
      type: String,
      enum: ['residential', 'industrial'],
      default: 'residential'
    }
  },
  notes: String
}, {
  timestamps: true
});

const Hub = mongoose.model('Hub', hubSchema);

export default Hub;