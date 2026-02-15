import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MemoryItem, AgentSettings } from '../types';
import { db } from '../services/firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { Loader2 } from 'lucide-react';

interface StoreContextType {
  memories: MemoryItem[];
  addMemory: (memory: MemoryItem) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;
  settings: AgentSettings;
  updateSettings: (newSettings: Partial<AgentSettings>) => Promise<void>;
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
  
  // Loading states
  const [memoriesLoaded, setMemoriesLoaded] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Sync Memories from Firebase
  useEffect(() => {
    const memoriesRef = ref(db, 'memories');
    const unsubscribe = onValue(memoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMemories = Object.values(data) as MemoryItem[];
        // Sort by timestamp desc (newest first)
        loadedMemories.sort((a, b) => b.timestamp - a.timestamp);
        setMemories(loadedMemories);
      } else {
        setMemories([]);
      }
      setMemoriesLoaded(true);
    }, (error) => {
      console.error("Firebase Read Error (Memories):", error);
      setMemoriesLoaded(true); // Allow app to load even on error (as empty)
    });

    return () => unsubscribe();
  }, []);

  // Sync Settings from Firebase
  useEffect(() => {
    const settingsRef = ref(db, 'settings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSettings(data);
      } else {
        // If settings don't exist in DB, initialize them
        set(settingsRef, DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
      setSettingsLoaded(true);
    }, (error) => {
       console.error("Firebase Read Error (Settings):", error);
       setSettingsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const addMemory = async (memory: MemoryItem) => {
    // Use the memory ID as the key in Firebase
    await set(ref(db, `memories/${memory.id}`), memory);
  };

  const removeMemory = async (id: string) => {
    await remove(ref(db, `memories/${id}`));
  };

  const updateSettings = async (newSettings: Partial<AgentSettings>) => {
    // We optimistically update state, but Firebase listener will confirm it
    await update(ref(db, 'settings'), newSettings);
  };

  const loading = !memoriesLoaded || !settingsLoaded;

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white space-y-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <div className="text-center">
          <p className="text-xl font-bold">Nexus Agent</p>
          <p className="text-sm text-gray-400">Syncing with Realtime Database...</p>
        </div>
      </div>
    );
  }

  return (
    <StoreContext.Provider value={{ memories, addMemory, removeMemory, settings, updateSettings, loading }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};