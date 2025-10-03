
import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center space-x-3 bg-[#2d2d2d] border border-gray-600 rounded-lg p-2">
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question or type '/' for commands..."
        className="flex-1 bg-transparent focus:outline-none resize-none text-gray-200 placeholder-gray-500 max-h-40"
        rows={1}
        disabled={isLoading}
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !inputValue.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};

export default ChatInput;
