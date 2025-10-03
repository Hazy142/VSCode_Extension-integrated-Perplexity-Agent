import React from 'react';
import { ChatMessage as ChatMessageType, Role } from '../types.js';
import { Icon } from './Icon.js';
import ResultsRenderer from './ResultsRenderer.js';

interface ChatMessageProps {
  message?: ChatMessageType;
  isLoading?: boolean;
}

const LoadingIndicator: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
    </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  if (isLoading) {
    message = {
      id: 'loading',
      role: Role.Assistant,
      content: '',
      timestamp: new Date()
    };
  }

  if (!message) return null;

  const isUser = message.role === Role.User;
  const ProfileIcon = isUser ? Icon.User : Icon.Bot;

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
        {!isUser && (
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-600 flex items-center justify-center">
                <ProfileIcon className="w-5 h-5 text-gray-300" />
            </div>
        )}
      <div className={`max-w-xl md:max-w-2xl lg:max-w-3xl w-full ${isUser ? 'flex justify-end' : ''}`}>
          <div className={`px-4 py-3 rounded-lg ${isUser ? 'bg-blue-600/80 text-white rounded-br-none' : 'bg-[#2d2d2d] text-gray-300 rounded-bl-none'}`}>
              {isLoading ? <LoadingIndicator /> : (
                  isUser ? (
                      // Fix: Type 'string | SearchResult' is not assignable to type 'ReactNode'.
                      // User message content should be a string, so we add a type check.
                      <p className="whitespace-pre-wrap">{typeof message.content === 'string' ? message.content : null}</p>
                  ) : (
                      <ResultsRenderer result={message.content} />
                  )
              )}
          </div>
      </div>
       {isUser && (
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-700 flex items-center justify-center">
                <ProfileIcon className="w-5 h-5 text-gray-300" />
            </div>
        )}
    </div>
  );
};

export default ChatMessage;