
import React from 'react';
import { View } from '../types.js';
import { Icon } from './Icon.js';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavItem: React.FC<{
  view: View;
  activeView: View;
  setActiveView: (view: View) => void;
  IconComponent: React.ComponentType<{ className?: string }>;
  label: string;
}> = ({ view, activeView, setActiveView, IconComponent, label }) => {
  const isActive = activeView === view;
  return (
    <button
      onClick={() => setActiveView(view)}
      className={`flex flex-col items-center justify-center w-full p-3 text-xs space-y-1 transition-colors duration-200 ${
        isActive ? 'text-white bg-white/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
      aria-label={label}
      title={label}
    >
      <IconComponent className="h-6 w-6" />
      <span>{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="flex flex-col h-full bg-[#252526] w-20 border-r border-gray-700/50">
      <div className="p-3">
        <div className="bg-blue-500 rounded-lg w-10 h-10 mx-auto"></div>
      </div>
      <div className="flex flex-col items-center space-y-2 mt-4">
        <NavItem view={View.Chat} activeView={activeView} setActiveView={setActiveView} IconComponent={Icon.Chat} label="Chat" />
        <NavItem view={View.Tools} activeView={activeView} setActiveView={setActiveView} IconComponent={Icon.Tools} label="Tools" />
        <NavItem view={View.Settings} activeView={activeView} setActiveView={setActiveView} IconComponent={Icon.Settings} label="Settings" />
      </div>
    </nav>
  );
};

export default Sidebar;
