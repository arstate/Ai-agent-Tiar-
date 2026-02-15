
import React from 'react';
import { ViewState } from '../types';
import { Database, MessageSquare, BrainCircuit, Settings as SettingsIcon } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden font-sans">
      <aside className="w-20 md:w-64 flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-gray-800">
          <BrainCircuit className="w-8 h-8 text-primary-500 mr-0 md:mr-3" />
          <span className="hidden md:block font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-purple-500">
            Nexus Agent
          </span>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2 md:px-4">
          <button
            onClick={() => setView('knowledge')}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
              currentView === 'knowledge'
                ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                : 'hover:bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Database className="w-6 h-6 flex-shrink-0" />
            <span className="hidden md:block ml-3 font-medium">Knowledge</span>
          </button>

          <button
            onClick={() => setView('chat')}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
              currentView === 'chat'
                ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                : 'hover:bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-6 h-6 flex-shrink-0" />
            <span className="hidden md:block ml-3 font-medium">WhatsApp Agent</span>
          </button>

          <button
            onClick={() => setView('settings')}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
              currentView === 'settings'
                ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                : 'hover:bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <SettingsIcon className="w-6 h-6 flex-shrink-0" />
            <span className="hidden md:block ml-3 font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 text-center md:text-left">
            <span className="hidden md:inline">Gemini 2.5 Flash + Rotation</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-auto bg-gray-900">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
