import React, { useState } from 'react';
import Layout from './components/Layout';
import KnowledgeBase from './components/KnowledgeBase';
import WhatsAppAgent from './components/WhatsAppAgent';
import { StoreProvider } from './contexts/StoreContext';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('knowledge');

  return (
    <StoreProvider>
      <Layout currentView={currentView} setView={setCurrentView}>
        {currentView === 'knowledge' && <KnowledgeBase />}
        {currentView === 'chat' && <WhatsAppAgent />}
      </Layout>
    </StoreProvider>
  );
};

export default App;