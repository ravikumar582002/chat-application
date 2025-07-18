import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useSocket } from '../../contexts/SocketContext';
import { HiPaperAirplane, HiPaperClip, HiEmojiHappy } from 'react-icons/hi';
import toast from 'react-hot-toast';

const MessageInput = ({ roomId }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, isSendingMessage } = useChat();
  const { startTyping, stopTyping } = useSocket();
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (!isTyping) {
      setIsTyping(true);
      startTyping(roomId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(roomId);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }

    try {
      await sendMessage(message.trim());
      setMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        stopTyping(roomId);
      }
      
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: Implement file upload functionality
      toast.info('File upload feature coming soon!');
    }
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = message.substring(0, start) + emoji + message.substring(end);
    
    setMessage(newValue);
    
    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const commonEmojis = ['😊', '👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯'];

  return (
    <div className="relative">
      {/* Emoji Picker */}
      <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-secondary-200 p-2 z-10">
        <div className="grid grid-cols-5 gap-1">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => insertEmoji(emoji)}
              className="p-1 hover:bg-secondary-100 rounded transition-colors text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* File Upload */}
        <label className="flex-shrink-0">
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors text-secondary-600 hover:text-secondary-700"
            title="Attach file"
          >
            <HiPaperClip className="h-5 w-5" />
          </button>
        </label>

        {/* Emoji Button */}
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-secondary-100 transition-colors text-secondary-600 hover:text-secondary-700"
          title="Add emoji"
        >
          <HiEmojiHappy className="h-5 w-5" />
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all duration-200"
            rows={1}
            style={{
              minHeight: '40px',
              maxHeight: '120px',
              height: 'auto'
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || isSendingMessage}
          className="flex-shrink-0 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send message"
        >
          {isSendingMessage ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <HiPaperAirplane className="h-5 w-5" />
          )}
        </button>
      </form>

      {/* Character Count */}
      {message.length > 0 && (
        <div className="text-xs text-secondary-500 mt-1 text-right">
          {message.length}/2000
        </div>
      )}
    </div>
  );
};

export default MessageInput;