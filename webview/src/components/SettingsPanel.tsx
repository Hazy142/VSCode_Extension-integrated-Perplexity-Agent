import React, { useState, useEffect, useCallback } from 'react';
import { vscode } from '../services/vscodeService';

type PerplexityModel = 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro' | 'sonar-deep-research';
import { ExtensionSettings } from '../../../src/types/messages';

const DEFAULT_SETTINGS_WEBVIEW: ExtensionSettings = {
    defaultModel: 'sonar',
    enrichWorkspaceContext: true,
    enrichActiveFileContext: true,
};

interface TestResult {
    ok: boolean;
    latencyMs?: number;
    error?: string;
    timestamp?: string;
}

export const SettingsPanel: React.FC<{ models: PerplexityModel[], onBack: () => void }> = ({ models, onBack }) => {
    const [apiKey, setApiKey] = useState('');
    const [apiKeyStatus, setApiKeyStatus] = useState<'missing' | 'saved' | 'invalid'>('missing');
    const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS_WEBVIEW);
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const handleMessages = useCallback((event: MessageEvent) => {
        const message = event.data;
        switch (message.command) {
            case 'settings:update':
                setSettings(message.data.settings);
                setApiKeyStatus(message.data.apiKeyStatus);
                break;
            case 'settings:key:update':
                if (message.data.ok) {
                    setApiKeyStatus(message.data.status);
                    setApiKey(''); // Clear input field on success
                }
                break;
            case 'settings:key:testResult':
                setTestResult({ ...message.data, timestamp: new Date().toLocaleTimeString() });
                setIsTesting(false);
                if(message.data.ok) {
                    setApiKeyStatus('saved');
                } else {
                    setApiKeyStatus('invalid');
                }
                break;
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleMessages);
        vscode.postMessage({ command: 'settings:get' });
        return () => window.removeEventListener('message', handleMessages);
    }, [handleMessages]);

    const handleSaveKey = () => {
        if (apiKey) {
            vscode.postMessage({ command: 'settings:key:set', data: { key: apiKey } });
        }
    };

    const handleDeleteKey = () => {
        vscode.postMessage({ command: 'settings:key:delete' });
    };

    const handleTestConnection = () => {
        setIsTesting(true);
        setTestResult(null);
        vscode.postMessage({ command: 'settings:key:test' });
    };

    const handleSaveSettings = () => {
        vscode.postMessage({ command: 'settings:save', data: settings });
    };
    
    const handleResetDefaults = () => {
        setSettings(DEFAULT_SETTINGS_WEBVIEW);
        vscode.postMessage({ command: 'settings:save', data: DEFAULT_SETTINGS_WEBVIEW });
    };

    const renderApiKeyStatus = () => {
        switch (apiKeyStatus) {
            case 'saved':
                return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Key Saved</span>;
            case 'missing':
                return <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">Key Missing</span>;
            case 'invalid':
                return <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Key Invalid</span>;
        }
    };

    console.log('RENDERING SETTINGS PANEL. State:', { apiKeyStatus, settings }); // Debug log

    return (
        <div className="p-4 text-sm text-white">
            <h1 className="p-2 mb-2 font-bold text-yellow-400 bg-red-800">DEBUG: SETTINGS PANEL IS RENDERING</h1>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Settings</h2>
                <button onClick={onBack} className="px-3 py-1 text-white bg-gray-600 rounded hover:bg-gray-500">Back to Chat</button>
            </div>

            {/* API Key Section */}
            <div className="p-3 mb-4 bg-gray-800 rounded-lg">
                <h3 className="mb-2 font-semibold">API Key</h3>
                <div className="flex items-center space-x-2">
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Perplexity API Key"
                        className="flex-grow p-2 text-white bg-gray-700 border border-gray-600 rounded"
                    />
                    <button onClick={handleSaveKey} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50" disabled={!apiKey}>Save</button>
                    <button onClick={handleDeleteKey} className="px-4 py-2 font-semibold text-white bg-red-600 rounded hover:bg-red-500">Delete</button>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                        <button onClick={handleTestConnection} className="px-4 py-2 font-semibold text-white bg-purple-600 rounded hover:bg-purple-500 disabled:opacity-50" disabled={isTesting}>
                            {isTesting ? 'Testing...' : 'Test Connection'}
                        </button>
                        {renderApiKeyStatus()}
                    </div>
                    {testResult && (
                        <div className={`text-xs p-2 rounded ${testResult.ok ? 'bg-green-900' : 'bg-red-900'}`}>
                            {testResult.ok ? `Success! Latency: ${testResult.latencyMs}ms` : `Error: ${testResult.error}`}
                            <span className="ml-2 text-gray-400">({testResult.timestamp})</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Model and Prompt Settings */}
            <div className="p-3 bg-gray-800 rounded-lg">
                <h3 className="mb-2 font-semibold">Model and Prompt</h3>
                <div className="space-y-3">
                    <div>
                        <label htmlFor="default-model" className="block mb-1 font-medium">Default Model</label>
                        <select
                            id="default-model"
                            value={settings.defaultModel}
                            onChange={(e) => setSettings({ ...settings, defaultModel: e.target.value as PerplexityModel })}
                            className="w-full p-2 text-white bg-gray-700 border border-gray-600 rounded"
                        >
                            {models.map(model => <option key={model} value={model}>{model}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="enrich-workspace"
                            checked={settings.enrichWorkspaceContext}
                            onChange={(e) => setSettings({ ...settings, enrichWorkspaceContext: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="enrich-workspace" className="ml-2">Enrich prompt with workspace context</label>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="enrich-file"
                            checked={settings.enrichActiveFileContext}
                            onChange={(e) => setSettings({ ...settings, enrichActiveFileContext: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="enrich-file" className="ml-2">Enrich prompt with active file context</label>
                    </div>
                </div>
            </div>

            {/* Save/Reset Buttons */}
            <div className="flex justify-end mt-4 space-x-2">
                <button onClick={handleResetDefaults} className="px-4 py-2 font-semibold text-white bg-gray-600 rounded hover:bg-gray-500">Reset to Defaults</button>
                <button onClick={handleSaveSettings} className="px-4 py-2 font-semibold text-white bg-green-600 rounded hover:bg-green-500">Save Settings</button>
            </div>
        </div>
    );
};