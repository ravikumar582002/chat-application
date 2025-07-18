const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

// Store connected users
const connectedUsers = new Map();

const handleSocketConnection = async (socket, io) => {
  try {
    // Authenticate socket connection
    const token = socket.handshake.auth.token;
    if (!token) {
      socket.disconnect();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ 
      firebaseUid: decoded.firebaseUid,
      isActive: true 
    });

    if (!user) {
      socket.disconnect();
      return;
    }

    // Update user status to online
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Store socket connection
    socket.userId = user._id;
    socket.user = user;
    connectedUsers.set(user._id.toString(), {
      socketId: socket.id,
      user: user,
      rooms: new Set()
    });

    // Join user to their rooms
    const userRooms = await ChatRoom.find({
      'members.user': user._id,
      'members.isActive': true,
      isActive: true
    });

    for (const room of userRooms) {
      socket.join(room._id.toString());
      connectedUsers.get(user._id.toString()).rooms.add(room._id.toString());
    }

    // Emit user online status to all connected users
    io.emit('user_status_change', {
      userId: user._id,
      status: 'online',
      lastSeen: user.lastSeen
    });

    console.log(`User ${user.displayName} connected: ${socket.id}`);

    // Handle joining a room
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;
        
        if (!roomId) {
          socket.emit('error', { message: 'Room ID is required' });
          return;
        }

        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isActive) {
          socket.emit('error', { message: 'Room not found or inactive' });
          return;
        }

        if (!room.isMember(user._id)) {
          socket.emit('error', { message: 'You are not a member of this room' });
          return;
        }

        socket.join(roomId);
        connectedUsers.get(user._id.toString()).rooms.add(roomId);

        // Notify room members
        socket.to(roomId).emit('user_joined_room', {
          roomId,
          user: {
            id: user._id,
            displayName: user.displayName,
            photoURL: user.photoURL
          }
        });

        socket.emit('joined_room', { roomId });

      } catch (error) {
        console.error('Join room socket error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle leaving a room
    socket.on('leave_room', async (data) => {
      try {
        const { roomId } = data;
        
        if (!roomId) {
          socket.emit('error', { message: 'Room ID is required' });
          return;
        }

        socket.leave(roomId);
        connectedUsers.get(user._id.toString()).rooms.delete(roomId);

        // Notify room members
        socket.to(roomId).emit('user_left_room', {
          roomId,
          user: {
            id: user._id,
            displayName: user.displayName
          }
        });

        socket.emit('left_room', { roomId });

      } catch (error) {
        console.error('Leave room socket error:', error);
        socket.emit('error', { message: 'Failed to leave room' });
      }
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
      try {
        const { roomId, content, type = 'text', replyTo, attachments } = data;

        if (!roomId || !content || content.trim().length === 0) {
          socket.emit('error', { message: 'Room ID and message content are required' });
          return;
        }

        const room = await ChatRoom.findById(roomId);
        if (!room || !room.isActive) {
          socket.emit('error', { message: 'Room not found or inactive' });
          return;
        }

        if (!room.isMember(user._id)) {
          socket.emit('error', { message: 'You are not a member of this room' });
          return;
        }

        // Create and save message
        const message = new Message({
          roomId,
          sender: user._id,
          content: content.trim(),
          type,
          replyTo: replyTo || null,
          attachments: attachments || []
        });

        await message.save();
        await message.populate('sender', 'displayName photoURL');
        await message.populate('replyTo', 'content sender');

        // Emit message to room
        io.to(roomId).emit('new_message', {
          message: message.messageInfo
        });

        // Update room's last message
        await room.updateLastMessage(message);

      } catch (error) {
        console.error('Send message socket error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing_start', (data) => {
      const { roomId } = data;
      if (roomId) {
        socket.to(roomId).emit('user_typing', {
          roomId,
          user: {
            id: user._id,
            displayName: user.displayName
          }
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      if (roomId) {
        socket.to(roomId).emit('user_stopped_typing', {
          roomId,
          user: {
            id: user._id,
            displayName: user.displayName
          }
        });
      }
    });

    // Handle message reactions
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;

        if (!messageId || !emoji) {
          socket.emit('error', { message: 'Message ID and emoji are required' });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        await message.addReaction(user._id, emoji);
        await message.populate('reactions.user', 'displayName photoURL');

        // Emit reaction to room
        io.to(message.roomId.toString()).emit('message_reaction_added', {
          messageId,
          reaction: {
            user: {
              id: user._id,
              displayName: user.displayName,
              photoURL: user.photoURL
            },
            emoji,
            createdAt: new Date()
          }
        });

      } catch (error) {
        console.error('Add reaction socket error:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    socket.on('remove_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;

        if (!messageId || !emoji) {
          socket.emit('error', { message: 'Message ID and emoji are required' });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        await message.removeReaction(user._id, emoji);

        // Emit reaction removal to room
        io.to(message.roomId.toString()).emit('message_reaction_removed', {
          messageId,
          userId: user._id,
          emoji
        });

      } catch (error) {
        console.error('Remove reaction socket error:', error);
        socket.emit('error', { message: 'Failed to remove reaction' });
      }
    });

    // Handle message editing
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content } = data;

        if (!messageId || !content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message ID and content are required' });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        if (message.sender.toString() !== user._id.toString()) {
          socket.emit('error', { message: 'Cannot edit messages from other users' });
          return;
        }

        await message.editMessage(content.trim());
        await message.populate('sender', 'displayName photoURL');

        // Emit edited message to room
        io.to(message.roomId.toString()).emit('message_edited', {
          message: message.messageInfo
        });

      } catch (error) {
        console.error('Edit message socket error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle message deletion
    socket.on('delete_message', async (data) => {
      try {
        const { messageId } = data;

        if (!messageId) {
          socket.emit('error', { message: 'Message ID is required' });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user is the sender or room admin
        const isSender = message.sender.toString() === user._id.toString();
        const room = await ChatRoom.findById(message.roomId);
        const isAdmin = room && room.members.some(m => 
          m.user.toString() === user._id.toString() && 
          m.role === 'admin' && 
          m.isActive
        );

        if (!isSender && !isAdmin) {
          socket.emit('error', { message: 'Cannot delete messages from other users' });
          return;
        }

        await message.deleteMessage();

        // Emit message deletion to room
        io.to(message.roomId.toString()).emit('message_deleted', {
          messageId
        });

      } catch (error) {
        console.error('Delete message socket error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle user status change
    socket.on('status_change', async (data) => {
      try {
        const { status } = data;

        if (!['online', 'offline', 'away'].includes(status)) {
          socket.emit('error', { message: 'Invalid status' });
          return;
        }

        await user.updateStatus(status);

        // Emit status change to all connected users
        io.emit('user_status_change', {
          userId: user._id,
          status,
          lastSeen: user.lastSeen
        });

      } catch (error) {
        console.error('Status change socket error:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      try {
        // Update user status to offline
        await user.updateStatus('offline');

        // Remove from connected users
        connectedUsers.delete(user._id.toString());

        // Emit user offline status
        io.emit('user_status_change', {
          userId: user._id,
          status: 'offline',
          lastSeen: user.lastSeen
        });

        console.log(`User ${user.displayName} disconnected: ${socket.id}`);

      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });

  } catch (error) {
    console.error('Socket connection error:', error);
    socket.disconnect();
  }
};

// Helper function to get connected users
const getConnectedUsers = () => {
  return Array.from(connectedUsers.values()).map(conn => ({
    userId: conn.user._id,
    displayName: conn.user.displayName,
    photoURL: conn.user.photoURL,
    rooms: Array.from(conn.rooms)
  }));
};

// Helper function to check if user is online
const isUserOnline = (userId) => {
  return connectedUsers.has(userId.toString());
};

module.exports = {
  handleSocketConnection,
  getConnectedUsers,
  isUserOnline
};