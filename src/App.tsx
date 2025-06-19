import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { RequestBuilder } from './components/Request/RequestBuilder';

function App() {
  return (
    <AppProvider>
      <div className="h-screen flex flex-col bg-gray-900">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <RequestBuilder />
        </div>
      </div>
    </AppProvider>
  );
}

export default App;