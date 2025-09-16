import { HttpRequest } from '../types';

interface Tab {
  id: string;
  name: string;
  request: HttpRequest | null;
  isActive: boolean;
}

const TABS_STORAGE_KEY = 'open_request_api_tabs';
const STORAGE_VERSION = '1.0';

interface StoredTabsData {
  version: string;
  tabs: Tab[];
  timestamp: number;
}

export const tabStorage = {
  // Guardar tabs en localStorage
  saveTabs: (tabs: Tab[]): void => {
    try {
      const data: StoredTabsData = {
        version: STORAGE_VERSION,
        tabs,
        timestamp: Date.now(),
      };
      localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save tabs to localStorage:', error);
    }
  },

  // Cargar tabs desde localStorage
  loadTabs: (): Tab[] | null => {
    try {
      const stored = localStorage.getItem(TABS_STORAGE_KEY);
      if (!stored) return null;

      const data: StoredTabsData = JSON.parse(stored);
      
      // Verificar versión y validez de los datos
      if (data.version !== STORAGE_VERSION || !Array.isArray(data.tabs)) {
        console.warn('Invalid or outdated tabs data, clearing storage');
        tabStorage.clearTabs();
        return null;
      }

      // Verificar que los datos no sean muy antiguos (más de 30 días)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      if (data.timestamp < thirtyDaysAgo) {
        console.info('Tabs data is too old, clearing storage');
        tabStorage.clearTabs();
        return null;
      }

      // Validar estructura de tabs
      const validTabs = data.tabs.filter(tab => 
        tab && 
        typeof tab.id === 'string' && 
        typeof tab.name === 'string' && 
        typeof tab.isActive === 'boolean'
      );

      if (validTabs.length === 0) {
        return null;
      }

      // Asegurar que solo un tab esté activo
      let hasActiveTab = false;
      const normalizedTabs = validTabs.map((tab, index) => {
        if (tab.isActive && !hasActiveTab) {
          hasActiveTab = true;
          return tab;
        } else if (tab.isActive && hasActiveTab) {
          return { ...tab, isActive: false };
        } else if (!hasActiveTab && index === validTabs.length - 1) {
          // Si no hay tab activo, activar el último
          return { ...tab, isActive: true };
        }
        return tab;
      });

      return normalizedTabs;
    } catch (error) {
      console.warn('Failed to load tabs from localStorage:', error);
      tabStorage.clearTabs();
      return null;
    }
  },

  // Limpiar tabs del localStorage
  clearTabs: (): void => {
    try {
      localStorage.removeItem(TABS_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear tabs from localStorage:', error);
    }
  },

  // Verificar si hay tabs guardados
  hasStoredTabs: (): boolean => {
    try {
      return localStorage.getItem(TABS_STORAGE_KEY) !== null;
    } catch (error) {
      return false;
    }
  },
};