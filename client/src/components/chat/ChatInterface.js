import React, { useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';

const ChatInterface = () => {
  const { currentRoom, messages, typingUsers } = useChat();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!currentRoom) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <ChatHeader room={currentRoom} />

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages} 
          typingUsers={typingUsers}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Message Input */}
      <div className="border-t border-secondary-200 p-4">
        <MessageInput roomId={currentRoom._id} />
      </div>
    </div>
  );
};

export default ChatInterface;
