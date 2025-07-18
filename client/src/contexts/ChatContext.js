import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSocket } from './SocketContext';
import api from '../config/api';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { socket, connected } = useSocket();
  const queryClient = useQueryClient();
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Fetch user's chat rooms
  const { data: rooms = [], refetch: refetchRooms } = useQuery(
    'chatRooms',
    async () => {
      const response = await api.get('/chat/rooms');
      return response.data.data.rooms;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 30000,
    }
  );

  // Fetch public rooms
  const { data: publicRooms = [], refetch: refetchPublicRooms } = useQuery(
    'publicRooms',
    async () => {
      const response = await api.get('/chat/public-rooms');
      return response.data.data.rooms;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 60000,
    }
  );

  // Fetch online users
  const { data: onlineUsersData = [], refetch: refetchOnlineUsers } = useQuery(
    'onlineUsers',
    async () => {
      const response = await api.get('/auth/online-users');
      return response.data.data.users;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 30000,
      refetchInterval: 30000,
    }
  );

  // Mutations
  const createRoomMutation = useMutation(
    async (roomData) => {
      const response = await api.post('/chat/rooms', roomData);
      return response.data.data.room;
    },
    {
      onSuccess: () => {
        refetchRooms();
        toast.success('Room created successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create room');
      },
    }
  );

  const joinRoomMutation = useMutation(
    async (roomId) => {
      const response = await api.post(`/chat/rooms/${roomId}/join`);
      return response.data;
    },
    {
      onSuccess: () => {
        refetchRooms();
        toast.success('Joined room successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to join room');
      },
    }
  );

  const leaveRoomMutation = useMutation(
    async (roomId) => {
      const response = await api.post(`/chat/rooms/${roomId}/leave`);
      return response.data;
    },
    {
      onSuccess: () => {
        refetchRooms();
        if (currentRoom?._id === currentRoom?._id) {
          setCurrentRoom(null);
          setMessages([]);
        }
        toast.success('Left room successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to leave room');
      },
    }
  );

  const sendMessageMutation = useMutation(
    async ({ roomId, content, type = 'text', replyTo = null, attachments = [] }) => {
      const response = await api.post(`/chat/rooms/${roomId}/messages`, {
        content,
        type,
        replyTo,
        attachments,
      });
      return response.data.data.message;
    },
    {
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message');
      },
    }
  );

  const editMessageMutation = useMutation(
    async ({ messageId, content }) => {
      const response = await api.put(`/chat/messages/${messageId}`, { content });
      return response.data.data.message;
    },
    {
      onSuccess: () => {
        toast.success('Message edited successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to edit message');
      },
    }
  );

  const deleteMessageMutation = useMutation(
    async (messageId) => {
      const response = await api.delete(`/chat/messages/${messageId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Message deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete message');
      },
    }
  );

  const addReactionMutation = useMutation(
    async ({ messageId, emoji }) => {
      const response = await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
      return response.data.data.message;
    },
    {
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add reaction');
      },
    }
  );

  const removeReactionMutation = useMutation(
    async ({ messageId, emoji }) => {
      const response = await api.delete(`/chat/messages/${messageId}/reactions`, {
        data: { emoji },
      });
      return response.data.data.message;
    },
    {
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove reaction');
      },
    }
  );

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      const { message } = data;
      if (currentRoom && message.roomId === currentRoom._id) {
        setMessages(prev => [...prev, message]);
      }
      // Update rooms list to show latest message
      refetchRooms();
    };

    const handleMessageEdited = (data) => {
      const { message } = data;
      if (currentRoom && message.roomId === currentRoom._id) {
        setMessages(prev => 
          prev.map(msg => msg._id === message._id ? message : msg)
        );
      }
    };

    const handleMessageDeleted = (data) => {
      const { messageId } = data;
      if (currentRoom) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
    };

    const handleUserTyping = (data) => {
      if (currentRoom && data.roomId === currentRoom._id) {
        setTypingUsers(prev => new Set([...prev, data.user.displayName]));
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (currentRoom && data.roomId === currentRoom._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.user.displayName);
          return newSet;
        });
      }
    };

    const handleUserJoinedRoom = (data) => {
      if (currentRoom && data.roomId === currentRoom._id) {
        refetchRooms();
      }
    };

    const handleUserLeftRoom = (data) => {
      if (currentRoom && data.roomId === currentRoom._id) {
        refetchRooms();
      }
    };

    const handleUserStatusChange = (data) => {
      refetchOnlineUsers();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('user_joined_room', handleUserJoinedRoom);
    socket.on('user_left_room', handleUserLeftRoom);
    socket.on('user_status_change', handleUserStatusChange);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('user_joined_room', handleUserJoinedRoom);
      socket.off('user_left_room', handleUserLeftRoom);
      socket.off('user_status_change', handleUserStatusChange);
    };
  }, [socket, currentRoom, refetchRooms, refetchOnlineUsers]);

  // Update online users
  useEffect(() => {
    setOnlineUsers(onlineUsersData);
  }, [onlineUsersData]);

  const selectRoom = async (room) => {
    try {
      setCurrentRoom(room);
      setMessages([]);
      setTypingUsers(new Set());

      // Fetch messages for the room
      const response = await api.get(`/chat/rooms/${room._id}/messages`);
      const fetchedMessages = response.data.data.messages;
      setMessages(fetchedMessages);

      // Join room via socket
      if (connected) {
        socket.emit('join_room', { roomId: room._id });
      }
    } catch (error) {
      console.error('Error selecting room:', error);
      toast.error('Failed to load room messages');
    }
  };

  const sendMessage = async (content, type = 'text', replyTo = null, attachments = []) => {
    if (!currentRoom) return;

    try {
      // Optimistic update
      const optimisticMessage = {
        _id: Date.now().toString(),
        roomId: currentRoom._id,
        content,
        type,
        replyTo,
        attachments,
        sender: {
          _id: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))._id : null,
          displayName: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'You',
          photoURL: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).photoURL : null,
        },
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };

      setMessages(prev => [...prev, optimisticMessage]);

      // Send via socket for real-time
      if (connected) {
        socket.emit('send_message', {
          roomId: currentRoom._id,
          content,
          type,
          replyTo,
          attachments,
        });
      }

      // Also send via API for persistence
      await sendMessageMutation.mutateAsync({
        roomId: currentRoom._id,
        content,
        type,
        replyTo,
        attachments,
      });

      // Remove optimistic message
      setMessages(prev => prev.filter(msg => !msg.isOptimistic));
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.isOptimistic));
      console.error('Error sending message:', error);
    }
  };

  const value = {
    // State
    currentRoom,
    messages,
    typingUsers,
    onlineUsers,
    rooms,
    publicRooms,
    connected,

    // Actions
    selectRoom,
    sendMessage,
    createRoom: createRoomMutation.mutateAsync,
    joinRoom: joinRoomMutation.mutateAsync,
    leaveRoom: leaveRoomMutation.mutateAsync,
    editMessage: editMessageMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
    addReaction: addReactionMutation.mutateAsync,
    removeReaction: removeReactionMutation.mutateAsync,

    // Loading states
    isCreatingRoom: createRoomMutation.isLoading,
    isJoiningRoom: joinRoomMutation.isLoading,
    isLeavingRoom: leaveRoomMutation.isLoading,
    isSendingMessage: sendMessageMutation.isLoading,
    isEditingMessage: editMessageMutation.isLoading,
    isDeletingMessage: deleteMessageMutation.isLoading,

    // Refetch functions
    refetchRooms,
    refetchPublicRooms,
    refetchOnlineUsers,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};