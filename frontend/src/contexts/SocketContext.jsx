import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import React from 'react';
const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    let socketInstance = null;
    
    if (isAuthenticated) {
      // Create socket connection
      socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });
      
      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });
      
      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });
      
      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });
      
      setSocket(socketInstance);
    }
    
    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated]);
  
  // Join a hub room
  const joinHub = (hubId) => {
    if (socket && connected) {
      socket.emit('join_hub', hubId);
    }
  };
  
  // Leave a hub room
  const leaveHub = (hubId) => {
    if (socket && connected) {
      socket.emit('leave_hub', hubId);
    }
  };
  
  const value = {
    socket,
    connected,
    joinHub,
    leaveHub
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;

//