import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import ToolsPanel from './components/ToolsPanel';
import SettingsPanel from './components/SettingsPanel';
import { View, ChatMessage, Role, ExtensionConfig, SearchResult, WorkspaceContext, FileContext } from '../types';
import { INITIAL_MESSAGES, INITIAL_CONFIG } from '../constants';
import { vscodeApi as vscode } from './services/vscodeService';

// The PerplexityModel type will be inferred from the data sent by the extension
type PerplexityModel = string;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Chat);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [config, setConfig] = useState<ExtensionConfig>(INITIAL_CONFIG);
  const [models, setModels] = useState<PerplexityModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<PerplexityModel>('sonar');
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext | null>(null);
  const [activeFileContext, setActiveFileContext] = useState<FileContext | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'updateModels':
          setModels(message.data as PerplexityModel[]);
          if (message.data && message.data.length > 0) {
            setSelectedModel(message.data[0]);
          }
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
        case 'workspaceContext':
          setWorkspaceContext(message.data as WorkspaceContext);
          break;
        case 'activeFileContext':
          setActiveFileContext(message.data as FileContext);
          break;
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

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const model = event.target.value as PerplexityModel;
    setSelectedModel(model);
    vscode.postMessage({
      command: 'selectModel',
      content: model,
    });
  };

  const getWorkspaceContext = () => {
    vscode.postMessage({ command: 'getWorkspaceContext' });
  };

  const getActiveFileContext = () => {
    vscode.postMessage({ command: 'getActiveFileContext' });
  };

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
        <div className="p-2 bg-[#252526] border-b border-gray-600">
          <select
            id="model-select"
            value={selectedModel}
            onChange={handleModelChange}
            className="w-full p-2 bg-[#3c3c3c] text-white rounded"
            disabled={models.length === 0}
          >
            {models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="p-2 bg-[#252526] border-b border-gray-600">
          <button onClick={getWorkspaceContext} className="w-full p-2 bg-[#3c3c3c] text-white rounded mb-2">Get Workspace Context</button>
          <button onClick={getActiveFileContext} className="w-full p-2 bg-[#3c3c3c] text-white rounded">Get Active File Context</button>
        </div>
        {renderActiveView()}
        <div className="p-2 bg-[#252526] border-t border-gray-600">
          {workspaceContext && <pre>{JSON.stringify(workspaceContext, null, 2)}</pre>}
          {activeFileContext && <pre>{JSON.stringify(activeFileContext, null, 2)}</pre>}
        </div>
      </main>
    </div>
  );
};

export default App;