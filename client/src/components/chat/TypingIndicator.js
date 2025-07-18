import React from 'react';

const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing`;
    } else {
      return `${users[0]} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <div className="flex items-center space-x-2 p-3">
      <div className="typing-indicator">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
      <span className="text-sm text-secondary-500">
        {getTypingText()}
      </span>
    </div>
  );
};

export default TypingIndicator;
