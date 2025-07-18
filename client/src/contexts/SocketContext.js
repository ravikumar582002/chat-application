import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (user && !socket) {
      const token = localStorage.getItem('token');
      if (!token) return;

      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'Socket connection error');
      });

      newSocket.on('user_status_change', (data) => {
        console.log('User status changed:', data);
      });

      newSocket.on('user_joined_room', (data) => {
        console.log('User joined room:', data);
        toast.success(`${data.user.displayName} joined the room`);
      });

      newSocket.on('user_left_room', (data) => {
        console.log('User left room:', data);
        toast(`${data.user.displayName} left the room`, {
          icon: '👋',
        });
      });

      newSocket.on('user_typing', (data) => {
        console.log('User typing:', data);
      });

      newSocket.on('user_stopped_typing', (data) => {
        console.log('User stopped typing:', data);
      });

      newSocket.on('new_message', (data) => {
        console.log('New message:', data);
      });

      newSocket.on('message_edited', (data) => {
        console.log('Message edited:', data);
      });

      newSocket.on('message_deleted', (data) => {
        console.log('Message deleted:', data);
      });

      newSocket.on('message_reaction_added', (data) => {
        console.log('Reaction added:', data);
      });

      newSocket.on('message_reaction_removed', (data) => {
        console.log('Reaction removed:', data);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, socket]);

  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('join_room', { roomId });
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leave_room', { roomId });
    }
  };

  const sendMessage = (roomId, content, type = 'text', replyTo = null, attachments = []) => {
    if (socket && connected) {
      socket.emit('send_message', {
        roomId,
        content,
        type,
        replyTo,
        attachments
      });
    }
  };

  const startTyping = (roomId) => {
    if (socket && connected) {
      socket.emit('typing_start', { roomId });
    }
  };

  const stopTyping = (roomId) => {
    if (socket && connected) {
      socket.emit('typing_stop', { roomId });
    }
  };

  const addReaction = (messageId, emoji) => {
    if (socket && connected) {
      socket.emit('add_reaction', { messageId, emoji });
    }
  };

  const removeReaction = (messageId, emoji) => {
    if (socket && connected) {
      socket.emit('remove_reaction', { messageId, emoji });
    }
  };

  const editMessage = (messageId, content) => {
    if (socket && connected) {
      socket.emit('edit_message', { messageId, content });
    }
  };

  const deleteMessage = (messageId) => {
    if (socket && connected) {
      socket.emit('delete_message', { messageId });
    }
  };

  const changeStatus = (status) => {
    if (socket && connected) {
      socket.emit('status_change', { status });
    }
  };

  const value = {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    removeReaction,
    editMessage,
    deleteMessage,
    changeStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};