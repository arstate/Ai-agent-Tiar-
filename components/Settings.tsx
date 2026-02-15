
import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Key, UserCog, Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const { settings, updateSettings, apiKeys, addApiKey, removeApiKey } = useStore();
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyLabel && newKeyValue) {
      await addApiKey(newKeyLabel, newKeyValue);
      setNewKeyLabel('');
      setNewKeyValue('');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-12">
      <section className="space-y-6">
        <div className="flex items-center space-x-3 border-b border-gray-800 pb-4">
          <UserCog className="w-6 h-6 text-primary-500" />
          <h2 className="text-2xl font-bold">Agent Persona</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Agent Role</label>
            <input 
              type="text" 
              value={settings.role}
              onChange={(e) => updateSettings({ role: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Sales Specialist"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Response Tone</label>
            <input 
              type="text" 
              value={settings.tone}
              onChange={(e) => updateSettings({ tone: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Friendly, Concise"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-400">Primary Language</label>
            <input 
              type="text" 
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Indonesian (Informal)"
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center space-x-3 border-b border-gray-800 pb-4">
          <Key className="w-6 h-6 text-purple-500" />
          <h2 className="text-2xl font-bold">API Key Rotation</h2>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-200">
            Add multiple Gemini API keys. The agent will automatically rotate between them to avoid 429 Rate Limit errors. 
            All keys are stored securely in your private Firebase database.
          </p>
        </div>

        <form onSubmit={handleAddKey} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Key Label (e.g. Account 1)"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary-500"
            />
            <input 
              type="password" 
              placeholder="Gemini API Key"
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-primary-500"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-500 py-2 rounded-lg flex items-center justify-center font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Key
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Keys ({apiKeys.length})</h3>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 bg-gray-800/20 rounded-xl border border-dashed border-gray-700">
              <p className="text-gray-500 text-sm">No external keys added. Using environment default.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {apiKeys.map((k) => (
                <div key={k.id} className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="font-medium">{k.label}</p>
                      <p className="text-xs text-gray-500">••••••••{k.key.slice(-4)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeApiKey(k.id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Settings;
