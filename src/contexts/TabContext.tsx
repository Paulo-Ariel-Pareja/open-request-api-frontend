import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { HttpRequest } from '../types';

interface Tab {
  id: string;
  name: string;
  request: HttpRequest | null;
  isActive: boolean;
}

interface TabContextType {
  tabs: Tab[];
  activeTab: Tab | undefined;
  createNewTab: () => void;
  closeTab: (tabId: string) => void;
  switchToTab: (tabId: string) => void;
  updateTabRequest: (tabId: string, request: HttpRequest | null) => void;
  openRequestInNewTab: (request: HttpRequest) => void;
  openRequestInActiveTab: (request: HttpRequest) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

interface TabProviderProps {
  children: ReactNode;
}

export function TabProvider({ children }: TabProviderProps) {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: 'tab-1',
      name: 'New Request',
      request: null,
      isActive: true,
    },
  ]);

  const activeTab = tabs.find(tab => tab.isActive);

  const createNewTab = useCallback(() => {
    const newTabId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newTabId,
      name: 'New Request',
      request: null,
      isActive: true,
    };

    setTabs(prevTabs => [
      ...prevTabs.map(tab => ({ ...tab, isActive: false })),
      newTab,
    ]);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prevTabs => {
      const filteredTabs = prevTabs.filter(tab => tab.id !== tabId);
      
      // Si no quedan tabs, crear uno nuevo
      if (filteredTabs.length === 0) {
        return [{
          id: `tab-${Date.now()}`,
          name: 'New Request',
          request: null,
          isActive: true,
        }];
      }

      // Si cerramos el tab activo, activar el último tab
      const closedTabWasActive = prevTabs.find(tab => tab.id === tabId)?.isActive;
      if (closedTabWasActive) {
        const lastTab = filteredTabs[filteredTabs.length - 1];
        return filteredTabs.map(tab => ({
          ...tab,
          isActive: tab.id === lastTab.id,
        }));
      }

      return filteredTabs;
    });
  }, []);

  const switchToTab = useCallback((tabId: string) => {
    setTabs(prevTabs =>
      prevTabs.map(tab => ({
        ...tab,
        isActive: tab.id === tabId,
      }))
    );
  }, []);

  const updateTabRequest = useCallback((tabId: string, request: HttpRequest | null) => {
    setTabs(prevTabs =>
      prevTabs.map(tab => {
        if (tab.id === tabId) {
          return {
            ...tab,
            name: request?.name || 'New Request',
            request,
          };
        }
        return tab;
      })
    );
  }, []);

  const openRequestInNewTab = useCallback((request: HttpRequest) => {
    const newTabId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newTabId,
      name: request.name,
      request,
      isActive: true,
    };

    setTabs(prevTabs => [
      ...prevTabs.map(tab => ({ ...tab, isActive: false })),
      newTab,
    ]);
  }, []);

  const openRequestInActiveTab = useCallback((request: HttpRequest) => {
    setTabs(prevTabs =>
      prevTabs.map(tab => {
        if (tab.isActive) {
          return {
            ...tab,
            name: request.name,
            request,
          };
        }
        return tab;
      })
    );
  }, []);

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTab,
        createNewTab,
        closeTab,
        switchToTab,
        updateTabRequest,
        openRequestInNewTab,
        openRequestInActiveTab,
      }}
    >
      {children}
    </TabContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabs must be used within a TabProvider');
  }
  return context;
}