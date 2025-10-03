
import React from 'react';
import { TOOLS } from '../constants.js';

const ToolsPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <h1 className="text-xl font-bold text-white mb-6">Available Tools</h1>
      <div className="space-y-4">
        {TOOLS.map((tool) => (
          <div key={tool.id} className="bg-[#2d2d2d] p-4 rounded-lg border border-gray-700/50 flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600/30 rounded-md flex items-center justify-center">
              <tool.icon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{tool.name}</h2>
              <p className="text-sm text-gray-400">{tool.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsPanel;
