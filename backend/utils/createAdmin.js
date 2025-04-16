
import User from '../models/User.js';

export default async function createAdmin() {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('Creating default admin user...');
      
      // Create admin user
      const admin = new User({
        username: 'admin',
        email: 'admin@aiotmonitor.com',
        password: 'admin123', // Will be hashed by the pre-save hook
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true
      });
      
      await admin.save();
      console.log('Default admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}
