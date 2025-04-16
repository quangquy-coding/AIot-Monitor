import express from 'express';
import Device from '../models/Device.js';
import Hub from '../models/Hub.js';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();

// Get all devices
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find().populate('hub', 'name type');
    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get device by ID
router.get('/:id', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate('hub', 'name type');
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'view_device',
      target: 'device',
      targetId: device._id,
      details: { 
        deviceName: device.name,
        deviceType: device.type
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json(device);
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create device (admin, team_lead, supervisor only)
router.post('/', async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'team_lead', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { name, type, model, serialNumber, hub, ipAddress, macAddress, firmware } = req.body;
    
    // Check if hub exists
    const hubExists = await Hub.findById(hub);
    if (!hubExists) {
      return res.status(404).json({ message: 'Hub not found' });
    }
    
    // Create device
    const newDevice = new Device({
      name,
      type,
      model,
      serialNumber,
      hub,
      ipAddress,
      macAddress,
      firmware
    });
    
    await newDevice.save();
    
    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'create_device',
      target: 'device',
      targetId: newDevice._id,
      details: { 
        deviceName: newDevice.name,
        deviceType: newDevice.type,
        hubId: hubExists._id,
        hubName: hubExists.name
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      message: 'Device created successfully',
      device: newDevice
    });
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update device
router.put('/:id', async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'team_lead', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { name, type, model, serialNumber, hub, status, ipAddress, macAddress, firmware } = req.body;
    
    // Find device
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Check if hub exists if changing hub
    if (hub && hub !== device.hub.toString()) {
      const hubExists = await Hub.findById(hub);
      if (!hubExists) {
        return res.status(404).json({ message: 'Hub not found' });
      }
    }
    
    // Update fields
    if (name) device.name = name;
    if (type) device.type = type;
    if (model) device.model = model;
    if (serialNumber) device.serialNumber = serialNumber;
    if (hub) device.hub = hub;
    if (status) device.status = status;
    if (ipAddress) device.ipAddress = ipAddress;
    if (macAddress) device.macAddress = macAddress;
    if (firmware) device.firmware = firmware;
    
    await device.save();
    
    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'update_device',
      target: 'device',
      targetId: device._id,
      details: { 
        deviceName: device.name,
        deviceStatus: device.status
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Device updated successfully',
      device
    });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete device (admin, team_lead only)
router.delete('/:id', async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'team_lead'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Find device
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Delete device
    await Device.deleteOne({ _id: device._id });
    
    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'delete_device',
      target: 'device',
      details: { 
        deviceName: device.name,
        deviceId: device._id
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update device status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Find device
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Update status
    device.status = status;
    device.lastPing = new Date();
    await device.save();
    
    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: 'update_device_status',
      target: 'device',
      targetId: device._id,
      details: { 
        deviceName: device.name,
        deviceStatus: device.status
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Device status updated successfully',
      device
    });
  } catch (error) {
    console.error('Update device status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;