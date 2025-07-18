import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { HiX, HiLogout, HiUser, HiCog, HiChat, HiGlobe, HiUsers } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';

const Sidebar = ({ onClose, onLogout, onCreateRoom }) => {
  const { user } = useAuth();
  const { rooms, publicRooms, onlineUsers, selectRoom, joinRoom, connected } = useChat();
  const [activeTab, setActiveTab] = useState('rooms');

  const handleRoomClick = (room) => {
    selectRoom(room);
    onClose();
  };

  const handleJoinRoom = async (room) => {
    try {
      await joinRoom(room._id);
      selectRoom(room);
      onClose();
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const getLastMessagePreview = (room) => {
    if (!room.lastMessage) return 'No messages yet';
    const content = room.lastMessage.content;
    return content.length > 30 ? `${content.substring(0, 30)}...` : content;
  };

  const getLastMessageTime = (room) => {
    if (!room.lastMessage?.timestamp) return '';
    return formatDistanceToNow(new Date(room.lastMessage.timestamp), { addSuffix: true });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-secondary-900">{user?.displayName}</h2>
            <p className="text-sm text-secondary-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors"
        >
          <HiX className="h-5 w-5 text-secondary-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-secondary-200">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'rooms'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-secondary-900'
          }`}
        >
          <HiChat className="h-4 w-4 inline mr-2" />
          My Rooms
        </button>
        <button
          onClick={() => setActiveTab('public')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'public'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-secondary-900'
          }`}
        >
          <HiGlobe className="h-4 w-4 inline mr-2" />
          Public
        </button>
        <button
          onClick={() => setActiveTab('online')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'online'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-secondary-900'
          }`}
        >
          <HiUsers className="h-4 w-4 inline mr-2" />
          Online
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'rooms' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">My Rooms</h3>
              <button
                onClick={onCreateRoom}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + New Room
              </button>
            </div>
            
            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <HiChat className="h-12 w-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500 mb-4">You haven't joined any rooms yet</p>
                <button
                  onClick={onCreateRoom}
                  className="btn-primary text-sm"
                >
                  Create Your First Room
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room._id}
                    onClick={() => handleRoomClick(room)}
                    className="p-3 rounded-lg hover:bg-secondary-50 cursor-pointer transition-colors border border-transparent hover:border-secondary-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-secondary-900 truncate">
                          {room.name}
                        </h4>
                        <p className="text-sm text-secondary-500 truncate">
                          {getLastMessagePreview(room)}
                        </p>
                      </div>
                      <span className="text-xs text-secondary-400 ml-2">
                        {getLastMessageTime(room)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-secondary-500">
                        {room.memberCount || 0} members
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        room.type === 'public' 
                          ? 'bg-success-100 text-success-700'
                          : 'bg-secondary-100 text-secondary-700'
                      }`}>
                        {room.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'public' && (
          <div className="p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Public Rooms</h3>
            
            {publicRooms.length === 0 ? (
              <div className="text-center py-8">
                <HiGlobe className="h-12 w-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500">No public rooms available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {publicRooms.map((room) => (
                  <div
                    key={room._id}
                    className="p-3 rounded-lg border border-secondary-200 hover:border-secondary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-secondary-900 truncate">
                          {room.name}
                        </h4>
                        <p className="text-sm text-secondary-500 truncate">
                          {room.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-secondary-500">
                        {room.memberCount || 0} members
                      </span>
                      <button
                        onClick={() => handleJoinRoom(room)}
                        className="btn-primary text-xs py-1 px-3"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'online' && (
          <div className="p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Online Users ({onlineUsers.length})
            </h3>
            
            {onlineUsers.length === 0 ? (
              <div className="text-center py-8">
                <HiUsers className="h-12 w-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500">No users online</p>
              </div>
            ) : (
              <div className="space-y-2">
                {onlineUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary-50 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-secondary-500">
                        Last seen {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-secondary-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success-500' : 'bg-error-500'}`} />
            <span className="text-xs text-secondary-500">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-900 transition-colors"
          >
            <HiLogout className="h-4 w-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;