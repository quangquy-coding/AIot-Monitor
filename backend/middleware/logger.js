import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    const user = req.user;
    const path = req.path;
    const method = req.method;
    
    // Only log if user is authenticated
    if (user && user.id) {
      const logData = {
        user: user.id,
        action: getActionFromPath(method, path),
        target: getTargetFromPath(path),
        targetId: getTargetIdFromPath(path),
        details: {
          method,
          path,
          statusCode: res.statusCode
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: res.statusCode >= 400 ? 'failure' : 'success'
      };
      
      // Create log entry
      ActivityLog.create(logData).catch(err => {
        console.error('Error creating activity log:', err);
      });
    }
    
    originalSend.apply(res, arguments);
    return res;
  };
  
  next();
};

// Helper functions to determine action and target from path
function getActionFromPath(method, path) {
  if (method === 'GET') return 'view';
  if (method === 'POST') return 'create';
  if (method === 'PUT') return 'update';
  if (method === 'DELETE') return 'delete';
  return 'other';
}

function getTargetFromPath(path) {
  if (path.includes('/users')) return 'user';
  if (path.includes('/hubs')) return 'hub';
  if (path.includes('/devices')) return 'device';
  if (path.includes('/auth')) return 'auth';
  if (path.includes('/logs')) return 'log';
  return 'other';
}

function getTargetIdFromPath(path) {
  const parts = path.split('/');
  for (let i = 0; i < parts.length; i++) {
    // Check if this part is an ID (MongoDB ObjectId is 24 hex chars)
    if (parts[i].match(/^[0-9a-fA-F]{24}$/)) {
      return parts[i];
    }
  }
  return null;
}
