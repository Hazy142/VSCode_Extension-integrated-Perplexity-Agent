import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { vscode } from '../services/vscodeService';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSendMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCancel = () => {
    console.log('🛑 User cancelled message');
    vscode.postMessage({ command: 'search:cancel' });
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <ChatMessage key={msg.id + '-' + index} message={msg} />
        ))}
        {isLoading && <ChatMessage isLoading={true} />}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 md:p-6 border-t border-gray-700/50 bg-[#1e1e1e] text-center">
        {isLoading && (
          <button
            onClick={handleCancel}
            className="mb-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white transition-colors"
          >
            Cancel
          </button>
        )}
        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatInterface;
