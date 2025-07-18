import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { format } from 'date-fns';
import { HiDotsVertical, HiPencil, HiTrash, HiReply } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Message = ({ message, showAvatar, showTimestamp, isLastInGroup }) => {
  const { user } = useAuth();
  const { editMessage, deleteMessage, addReaction, removeReaction } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showReactions, setShowReactions] = useState(false);

  const isOwnMessage = message.sender._id === user?._id;
  const canEdit = isOwnMessage && !message.edited?.isEdited;
  const canDelete = isOwnMessage;

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      await editMessage(message._id, editContent);
      setIsEditing(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMessage(message._id);
      setShowMenu(false);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReaction = async (emoji) => {
    try {
      const hasReaction = message.reactions?.some(r => 
        r.user._id === user?._id && r.emoji === emoji
      );

      if (hasReaction) {
        await removeReaction(message._id, emoji);
      } else {
        await addReaction(message._id, emoji);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-xs lg:max-w-md`}>
        {/* Avatar */}
        {showAvatar && (
          <div className={`flex-shrink-0 ${isOwnMessage ? 'ml-3' : 'mr-3'}`}>
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {message.sender.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {/* Sender Name */}
          {showAvatar && (
            <div className={`text-xs text-secondary-500 mb-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
              {message.sender.displayName}
            </div>
          )}

          {/* Message Bubble */}
          <div className="relative group">
            <div className={`message-bubble ${
              isOwnMessage ? 'message-bubble-sent' : 'message-bubble-received'
            }`}>
              {/* Reply to message */}
              {message.replyTo && (
                <div className="mb-2 p-2 bg-black bg-opacity-10 rounded text-sm">
                  <div className="font-medium text-xs opacity-75">
                    Replying to {message.replyTo.sender.displayName}
                  </div>
                  <div className="opacity-75">{message.replyTo.content}</div>
                </div>
              )}

              {/* Message content */}
              <div className="whitespace-pre-wrap">{message.content}</div>

              {/* Edited indicator */}
              {message.edited?.isEdited && (
                <div className="text-xs opacity-75 mt-1">(edited)</div>
              )}
            </div>

            {/* Message Actions */}
            <div className={`absolute top-0 ${isOwnMessage ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity`}>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded hover:bg-secondary-100 transition-colors"
                >
                  <HiDotsVertical className="h-4 w-4 text-secondary-600" />
                </button>

                {/* Action Menu */}
                {showMenu && (
                  <div className={`absolute top-0 ${isOwnMessage ? 'right-0' : 'left-0'} bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-10 min-w-[120px]`}>
                    <button
                      onClick={() => setShowReactions(!showReactions)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-secondary-50 flex items-center space-x-2"
                    >
                      <span>😊</span>
                      <span>React</span>
                    </button>
                    
                    <button
                      onClick={() => {/* TODO: Implement reply */}}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-secondary-50 flex items-center space-x-2"
                    >
                      <HiReply className="h-4 w-4" />
                      <span>Reply</span>
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-secondary-50 flex items-center space-x-2"
                      >
                        <HiPencil className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-error-50 text-error-600 flex items-center space-x-2"
                      >
                        <HiTrash className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Reactions Menu */}
                {showReactions && (
                  <div className={`absolute top-0 ${isOwnMessage ? 'right-0' : 'left-0'} bg-white rounded-lg shadow-lg border border-secondary-200 p-2 z-10`}>
                    <div className="flex space-x-1">
                      {commonReactions.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            handleReaction(emoji);
                            setShowReactions(false);
                            setShowMenu(false);
                          }}
                          className="p-1 hover:bg-secondary-100 rounded transition-colors text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(
                message.reactions.reduce((acc, reaction) => {
                  acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 transition-colors ${
                    message.reactions.some(r => r.user._id === user?._id && r.emoji === emoji)
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          {showTimestamp && (
            <div className={`text-xs text-secondary-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
              {format(new Date(message.createdAt), 'HH:mm')}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsEditing(false)}
            />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Edit Message
                </h3>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="Edit your message..."
                />
              </div>
              <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleEdit}
                  className="btn-primary w-full sm:w-auto sm:ml-3"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
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

export default Message;