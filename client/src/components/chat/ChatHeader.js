import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { HiUsers, HiInformationCircle, HiCog, HiLogout } from 'react-icons/hi';
import toast from 'react-hot-toast';

const ChatHeader = ({ room }) => {
  const { user } = useAuth();
  const { leaveRoom, isLeavingRoom } = useChat();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(room._id);
      setShowLeaveConfirm(false);
    } catch (error) {
      console.error('Error leaving room:', error);
      toast.error('Failed to leave room');
    }
  };

  const isRoomAdmin = room.members?.some(member => 
    member.user === user?._id && member.role === 'admin'
  );

  return (
    <div className="bg-white border-b border-secondary-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">
              {room.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">
              {room.name}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-secondary-500">
              <span className="flex items-center space-x-1">
                <HiUsers className="h-4 w-4" />
                <span>{room.memberCount || 0} members</span>
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                room.type === 'public' 
                  ? 'bg-success-100 text-success-700'
                  : 'bg-secondary-100 text-secondary-700'
              }`}>
                {room.type}
              </span>
              {isRoomAdmin && (
                <span className="px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-700">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
            title="Room Info"
          >
            <HiInformationCircle className="h-5 w-5 text-secondary-600" />
          </button>
          
          {isRoomAdmin && (
            <button
              className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              title="Room Settings"
            >
              <HiCog className="h-5 w-5 text-secondary-600" />
            </button>
          )}
          
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="p-2 rounded-lg hover:bg-error-100 hover:text-error-600 transition-colors"
            title="Leave Room"
          >
            <HiLogout className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Leave Room Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowLeaveConfirm(false)}
            />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-error-100 sm:mx-0 sm:h-10 sm:w-10">
                    <HiLogout className="h-6 w-6 text-error-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-secondary-900">
                      Leave Room
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-secondary-500">
                        Are you sure you want to leave "{room.name}"? You can rejoin later if it's a public room.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  disabled={isLeavingRoom}
                  className="btn-error w-full sm:w-auto sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLeavingRoom ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Leaving...</span>
                    </div>
                  ) : (
                    'Leave Room'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeaveConfirm(false)}
                  className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;