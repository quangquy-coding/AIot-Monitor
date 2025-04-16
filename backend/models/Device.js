import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  },
  hub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    required: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance', 'error'],
    default: 'offline'
  },
  lastPing: {
    type: Date
  },
  readings: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: String,
    value: mongoose.Schema.Types.Mixed
  }],
  firmware: {
    version: String,
    lastUpdated: Date
  },
  ipAddress: {
    type: String,
    trim: true
  },
  macAddress: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Device = mongoose.model('Device', deviceSchema);

export default Device;