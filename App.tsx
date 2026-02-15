
import React, { useState } from 'react';
import Layout from './components/Layout';
import KnowledgeBase from './components/KnowledgeBase';
import WhatsAppAgent from './components/WhatsAppAgent';
import Settings from './components/Settings';
import SetupView from './components/SetupView';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { ViewState } from './types';

const MainContent: React.FC = () => {
  const { apiKeys } = useStore();
  const [currentView, setCurrentView] = useState<ViewState>('knowledge');

  // If no API keys are configured, force the Setup view
  if (apiKeys.length === 0) {
    return <SetupView />;
  }

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {currentView === 'knowledge' && <KnowledgeBase />}
      {currentView === 'chat' && <WhatsAppAgent />}
      {currentView === 'settings' && <Settings />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
};

export default App;
