
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MemoryItem, AgentSettings, ApiKeyEntry } from '../types';
import { db } from '../services/firebase';
import { ref, onValue, set, remove, update, push } from 'firebase/database';
import { Loader2 } from 'lucide-react';

interface StoreContextType {
  memories: MemoryItem[];
  addMemory: (memory: MemoryItem) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;
  settings: AgentSettings;
  updateSettings: (newSettings: Partial<AgentSettings>) => Promise<void>;
  apiKeys: ApiKeyEntry[];
  addApiKey: (label: string, key: string) => Promise<void>;
  removeApiKey: (id: string) => Promise<void>;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AgentSettings = {
  role: "Customer Support Specialist",
  tone: "Professional yet friendly",
  language: "Indonesian (Formal/Casual mix)"
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  
  const [memoriesLoaded, setMemoriesLoaded] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [keysLoaded, setKeysLoaded] = useState(false);

  useEffect(() => {
    const memoriesRef = ref(db, 'memories');
    return onValue(memoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loaded = Object.values(data) as MemoryItem[];
        loaded.sort((a, b) => b.timestamp - a.timestamp);
        setMemories(loaded);
      } else setMemories([]);
      setMemoriesLoaded(true);
    });
  }, []);

  useEffect(() => {
    const settingsRef = ref(db, 'settings');
    return onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSettings(data);
      else set(settingsRef, DEFAULT_SETTINGS);
      setSettingsLoaded(true);
    });
  }, []);

  useEffect(() => {
    const keysRef = ref(db, 'api_keys');
    return onValue(keysRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loaded = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        })) as ApiKeyEntry[];
        setApiKeys(loaded);
      } else setApiKeys([]);
      setKeysLoaded(true);
    });
  }, []);

  const addMemory = async (memory: MemoryItem) => {
    await set(ref(db, `memories/${memory.id}`), memory);
  };

  const removeMemory = async (id: string) => {
    await remove(ref(db, `memories/${id}`));
  };

  const updateSettings = async (newSettings: Partial<AgentSettings>) => {
    await update(ref(db, 'settings'), newSettings);
  };

  const addApiKey = async (label: string, key: string) => {
    const keysRef = ref(db, 'api_keys');
    await push(keysRef, {
      label,
      key,
      createdAt: Date.now()
    });
  };

  const removeApiKey = async (id: string) => {
    await remove(ref(db, `api_keys/${id}`));
  };

  const loading = !memoriesLoaded || !settingsLoaded || !keysLoaded;

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white space-y-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <div className="text-center">
          <p className="text-xl font-bold">Nexus Agent</p>
          <p className="text-sm text-gray-400">Loading Intelligence Core...</p>
        </div>
      </div>
    );
  }

  return (
    <StoreContext.Provider value={{ 
      memories, addMemory, removeMemory, 
      settings, updateSettings, 
      apiKeys, addApiKey, removeApiKey,
      loading 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
};
