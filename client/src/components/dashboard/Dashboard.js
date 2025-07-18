import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useSocket } from '../../contexts/SocketContext';
import Sidebar from './Sidebar';
import ChatInterface from '../chat/ChatInterface';
import CreateRoomModal from './CreateRoomModal';
import { HiPlus, HiMenu, HiX } from 'react-icons/hi';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user, logout } = useAuth();
  const { currentRoom, connected } = useChat();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="h-screen bg-secondary-50 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          onCreateRoom={handleCreateRoom}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-secondary-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                <HiMenu className="h-6 w-6 text-secondary-600" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-secondary-900">
                    {currentRoom ? currentRoom.name : 'ChatApp'}
                  </h1>
                  <p className="text-sm text-secondary-500">
                    {currentRoom ? `${currentRoom.memberCount || 0} members` : 'Select a room to start chatting'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Connection status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success-500' : 'bg-error-500'}`} />
                <span className="text-xs text-secondary-500 hidden sm:block">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Create room button */}
              <button
                onClick={handleCreateRoom}
                className="btn-primary flex items-center space-x-2"
              >
                <HiPlus className="h-4 w-4" />
                <span className="hidden sm:block">New Room</span>
              </button>
            </div>
          </div>
        </header>

        {/* Chat interface */}
        <main className="flex-1 overflow-hidden">
          {currentRoom ? (
            <ChatInterface />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-secondary-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-secondary-900 mb-2">
                  Welcome to ChatApp
                </h2>
                <p className="text-secondary-600 mb-6 max-w-md">
                  Select a room from the sidebar to start chatting with others. 
                  You can join public rooms or create your own private space.
                </p>
                <button
                  onClick={handleCreateRoom}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <HiPlus className="h-4 w-4" />
                  <span>Create Your First Room</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;