import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { SettingsPanel } from './components/SettingsPanel';
import { View, ChatMessage, Role, SearchResult } from '../types';
import { INITIAL_MESSAGES } from '../constants';
import { vscode } from './services/vscodeService';

type PerplexityModel = 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro' | 'sonar-deep-research';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Chat);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [models, setModels] = useState<PerplexityModel[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'updateModels':
          setModels(message.data || []);
          break;
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

    vscode.postMessage({ command: 'settings:get' });

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
      data: { text: content }
    });
  }, [isLoading]);

  const renderActiveView = () => {
    switch (activeView) {
      case View.Chat:
        return <ChatInterface messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />;
      case View.Settings:
        return <SettingsPanel models={models} onBack={() => setActiveView(View.Chat)} />;
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