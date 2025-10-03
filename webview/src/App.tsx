
import React, { useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar.js';
import ChatInterface from '../components/ChatInterface.js';
import ToolsPanel from '../components/ToolsPanel.js';
import SettingsPanel from '../components/SettingsPanel.js';
import { View, ChatMessage, Role, ExtensionConfig } from '../types.js';
import { fetchChatResponse } from '../services/geminiService.js';
import { INITIAL_MESSAGES, INITIAL_CONFIG } from '../constants.js';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Chat);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [config, setConfig] = useState<ExtensionConfig>(INITIAL_CONFIG);

  const handleSendMessage = useCallback(async (content: string) => {
    if (isLoading || !content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: Role.User,
      content,
      timestamp: new Date(),
    };

    setMessages((prev: ChatMessage[]) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const assistantMessage = await fetchChatResponse(content);
      setMessages((prev: ChatMessage[]) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: Role.Assistant,
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
