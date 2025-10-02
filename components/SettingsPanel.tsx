
import React from 'react';
import { ExtensionConfig } from '../types';

interface SettingsPanelProps {
  config: ExtensionConfig;
  onConfigChange: (newConfig: ExtensionConfig) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onConfigChange }) => {
  const handleSelectChange = <K extends keyof ExtensionConfig>(key: K, value: ExtensionConfig[K]) => {
    onConfigChange({ ...config, [key]: value });
  };
  
  const handleToggleChange = (key: keyof ExtensionConfig) => {
      onConfigChange({ ...config, [key]: !config[key] });
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <h1 className="text-xl font-bold text-white mb-8">Settings</h1>
      <div className="space-y-8">
        {/* API Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">API Configuration</h2>
          <div className="flex items-center justify-between">
            <label htmlFor="apiKey" className="text-sm text-gray-400">API Key</label>
            <div className="flex items-center space-x-2">
                <input id="apiKey" type="password" value="••••••••••••••••••••" readOnly className="w-64 bg-[#2d2d2d] border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                    config.apiKeyStatus === 'valid' ? 'bg-green-500/20 text-green-400' :
                    config.apiKeyStatus === 'invalid' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                }`}>
                    {config.apiKeyStatus}
                </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="defaultModel" className="text-sm text-gray-400">Default Model</label>
            <select
              id="defaultModel"
              value={config.defaultModel}
              onChange={(e) => handleSelectChange('defaultModel', e.target.value as ExtensionConfig['defaultModel'])}
              className="bg-[#2d2d2d] border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sonar-pro">Sonar Pro</option>
              <option value="sonar-medium-online">Sonar Medium Online</option>
              <option value="sonar-medium-chat">Sonar Medium Chat</option>
            </select>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">Feature Toggles</h2>
          <div className="flex items-center justify-between">
            <label htmlFor="enableMCP" className="text-sm text-gray-400">Enable MCP Server</label>
            <button onClick={() => handleToggleChange('enableMCP')} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${config.enableMCP ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full transform transition-transform duration-300 ${config.enableMCP ? 'translate-x-6' : 'translate-x-0'}`}></span>
            </button>
          </div>
           <div className="flex items-center justify-between">
            <label htmlFor="enableWorkspaceAnalysis" className="text-sm text-gray-400">Enable Workspace Analysis</label>
            <button onClick={() => handleToggleChange('enableWorkspaceAnalysis')} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${config.enableWorkspaceAnalysis ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full transform transition-transform duration-300 ${config.enableWorkspaceAnalysis ? 'translate-x-6' : 'translate-x-0'}`}></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
