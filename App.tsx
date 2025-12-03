import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { QuoteLibrary } from './components/QuoteLibrary';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LIBRARY);

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      <div className="max-w-4xl mx-auto w-full px-4 py-8">
        {currentView === ViewState.LIBRARY && <QuoteLibrary />}
        {currentView === ViewState.CREATE && <VideoAnalyzer />}
      </div>
    </Layout>
  );
};

export default App;