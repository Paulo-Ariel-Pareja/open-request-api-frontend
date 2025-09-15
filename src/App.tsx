import { AppProvider } from './contexts/AppContext';
import { TabProvider } from './contexts/TabContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { TabManager } from './components/Layout/TabManager';

function App() {
  return (
    <AppProvider>
      <TabProvider>
        <div className="h-screen flex flex-col bg-gray-900 flex-container-constrained">
          <Header />
          <div className="flex-1 flex overflow-hidden min-w-0">
            <Sidebar />
            <TabManager />
          </div>
        </div>
      </TabProvider>
    </AppProvider>
  );
}

export default App;