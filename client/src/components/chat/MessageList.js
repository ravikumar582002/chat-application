import React from 'react';
import { format } from 'date-fns';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ messages, typingUsers, messagesEndRef }) => {
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="p-4 space-y-6">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date} className="space-y-4">
            {/* Date Header */}
            <div className="flex items-center justify-center">
              <div className="bg-secondary-100 px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-secondary-600">
                  {formatDateHeader(date)}
                </span>
              </div>
            </div>
            
            {/* Messages for this date */}
            <div className="space-y-4">
              {dateMessages.map((message, index) => {
                const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                const nextMessage = index < dateMessages.length - 1 ? dateMessages[index + 1] : null;
                
                return (
                  <Message
                    key={message._id}
                    message={message}
                    showAvatar={!prevMessage || prevMessage.sender._id !== message.sender._id}
                    showTimestamp={!nextMessage || nextMessage.sender._id !== message.sender._id}
                    isLastInGroup={!nextMessage || nextMessage.sender._id !== message.sender._id}
                  />
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <TypingIndicator users={Array.from(typingUsers)} />
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;