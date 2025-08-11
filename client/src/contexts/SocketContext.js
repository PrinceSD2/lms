import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { apiBaseURL } from '../utils/axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socket = useRef(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
  socket.current = io(apiBaseURL, {
        transports: ['websocket'],
        upgrade: false,
        auth: {
          userId: user._id,
          userRole: user.role
        }
      });

      // Join user-specific room
      socket.current.emit('join-room', `user-${user._id}`);
      socket.current.emit('join-room', user.role);

      // Socket event listeners
      socket.current.on('connect', () => {
        console.log('Connected to server');
      });

      socket.current.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      // Lead events
      socket.current.on('leadCreated', (data) => {
        if (user.role === 'agent2' || user.role === 'admin') {
          toast.success(`New lead added by ${data.createdBy}`);
        }
        // Trigger refresh of leads list
        window.dispatchEvent(new CustomEvent('refreshLeads'));
      });

      socket.current.on('leadUpdated', (data) => {
        if (user.role === 'agent1' || user.role === 'admin') {
          toast.success(`Lead updated by ${data.updatedBy}`);
        }
        // Trigger refresh of leads list
        window.dispatchEvent(new CustomEvent('refreshLeads'));
      });

      socket.current.on('leadDeleted', (data) => {
        if (user.role !== 'admin') {
          toast.info(`A lead was removed by ${data.deletedBy}`);
        }
        // Trigger refresh of leads list
        window.dispatchEvent(new CustomEvent('refreshLeads'));
      });

      // Admin dashboard real-time updates
      if (user.role === 'admin') {
        socket.current.on('statsUpdated', (data) => {
          // Trigger dashboard stats refresh
          window.dispatchEvent(new CustomEvent('refreshStats', { detail: data }));
        });
      }

      return () => {
        if (socket.current) {
          socket.current.disconnect();
        }
      };
    }
  }, [isAuthenticated, user]);

  // Socket methods
  const emitEvent = (event, data) => {
    if (socket.current) {
      socket.current.emit(event, data);
    }
  };

  const onEvent = (event, callback) => {
    if (socket.current) {
      socket.current.on(event, callback);
    }
  };

  const offEvent = (event, callback) => {
    if (socket.current) {
      socket.current.off(event, callback);
    }
  };

  const value = {
    socket: socket.current,
    emitEvent,
    onEvent,
    offEvent
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};

export default SocketContext;
