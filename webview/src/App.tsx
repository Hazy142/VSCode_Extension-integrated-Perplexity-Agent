import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { SettingsPanel } from './components/SettingsPanel';
import { View, ChatMessage, Role } from '../types';
import { INITIAL_MESSAGES } from '../constants';
import { vscode } from './services/vscodeService';

type PerplexityModel = 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro' | 'sonar-deep-research';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Chat);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [models] = useState<PerplexityModel[]>([]); // ✅ setModels removed
  const [currentAssistantMessageId, setCurrentAssistantMessageId] = useState<string>('');

  // Message Handler for Backend → Frontend communication
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
        const { command, data } = event.data;
        
        switch (command) {
            case 'stream:chunk':
                // Update current assistant message with streaming data
                setMessages(prev => prev.map(msg => 
                    msg.id === currentAssistantMessageId 
                        ? { ...msg, content: msg.content + data }
                        : msg
                ));
                break;
                
            case 'stream:end':
                console.log('✅ Stream ended, stopping loading');
                setIsLoading(false);
                setCurrentAssistantMessageId('');
                break;
                
            case 'stream:error':
            case 'error':
                console.log('❌ Stream error, stopping loading');
                setIsLoading(false);
                setCurrentAssistantMessageId('');
                // Update assistant message with error
                setMessages(prev => prev.map(msg => 
                    msg.id === currentAssistantMessageId 
                        ? { ...msg, content: `Sorry, an error occurred. Please try again.` }
                        : msg
                ));
                break;

            case 'updateModels':
                // Handle model updates if needed in the future
                break;
        }
    };
    
    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [currentAssistantMessageId]);

  const handleSendMessage = useCallback((content: string) => {
    if (isLoading || !content.trim()) return;

    console.log('🚀 Sending message:', content);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: Role.User,
      content,
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: Role.Assistant,
      content: '', // Will be filled by streaming
      timestamp: new Date(),
    };
    
    setCurrentAssistantMessageId(assistantMessage.id);
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    // Send to backend
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
