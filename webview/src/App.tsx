
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import ToolsPanel from './components/ToolsPanel';
import SettingsPanel from './components/SettingsPanel';
import { View, ChatMessage, Role, ExtensionConfig, SearchResult } from '../types';
// import { fetchChatResponse } from './services/geminiService'; // No longer needed
import { INITIAL_MESSAGES, INITIAL_CONFIG } from '../constants';

import { vscodeApi as vscode } from './services/vscodeService';


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Chat);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [config, setConfig] = useState<ExtensionConfig>(INITIAL_CONFIG);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data; // The JSON data from the extension
      switch (message.command) {
        case 'searchResult': {
          setIsLoading(false);
          const assistantMessage: ChatMessage = {
            id: Date.now().toString(),
            role: Role.Assistant,
            content: message.data as SearchResult,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          break;
        }
        case 'error': {
          setIsLoading(false);
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            role: Role.Assistant,
            content: `An error occurred: ${message.message}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    if (isLoading || !content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: Role.User,
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    vscode.postMessage({
      command: 'search',
      text: content
    });
  }, [isLoading]);

  const renderActiveView = () => {
    switch (activeView) {
      case View.Chat:
        return <ChatInterface messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />;
      case View.Tools:
        return <ToolsPanel />;
      case View.Settings:
        return <SettingsPanel config={config} onConfigChange={setConfig} />;
      default:
        return <ChatInterface messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#1e1e1e] text-gray-300 font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {renderActiveView()}
      </main>
    </div>
  );
};

export default App;
