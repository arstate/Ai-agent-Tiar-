
import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Key, BrainCircuit, Rocket, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react';

const SetupView: React.FC = () => {
  const { addApiKey } = useStore();
  const [label, setLabel] = useState('Primary Key');
  const [key, setKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addApiKey(label, key.trim());
    } catch (error) {
      console.error("Failed to add key:", error);
      alert("Error saving API key. Check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-primary-600/10 rounded-3xl border border-primary-500/20 mb-2">
            <BrainCircuit className="w-12 h-12 text-primary-500" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Welcome to Nexus</h1>
          <p className="text-gray-400">
            Nexus Agent uses <span className="text-primary-400 font-semibold">Gemini 2.5 Flash</span> to learn from your data. To get started, please provide your first API key.
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center">
              <Key className="w-4 h-4 mr-2" /> API Configuration
            </span>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 flex items-center transition-colors"
            >
              Get a key <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                placeholder="Account Name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Gemini API Key</label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all font-mono text-sm"
                placeholder="AIzaSy..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !key.trim()}
              className="w-full bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-900/20 flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Initialize Agent <Rocket className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/30 border border-gray-800/50 p-4 rounded-2xl flex flex-col items-center text-center space-y-1">
             <ShieldCheck className="w-5 h-5 text-emerald-500" />
             <span className="text-[10px] text-gray-500 font-semibold uppercase">Secure Storage</span>
          </div>
          <div className="bg-gray-900/30 border border-gray-800/50 p-4 rounded-2xl flex flex-col items-center text-center space-y-1">
             <BrainCircuit className="w-5 h-5 text-purple-500" />
             <span className="text-[10px] text-gray-500 font-semibold uppercase">Flash 2.5 Logic</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupView;
