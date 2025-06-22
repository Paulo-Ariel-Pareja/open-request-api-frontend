import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { HttpRequest, Environment, Collection, CollectionFull } from "../types";
import { scheduleService } from "../services/schedule";
import { apiService } from "../services/api";

interface AppContextType {
  // Active states
  activeRequest: HttpRequest | null;
  setActiveRequest: (request: HttpRequest | null) => void;
  activeEnvironments: Environment[];
  setActiveEnvironments: (environments: Environment[]) => void;

  // UI states
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Data states (in memory)
  collections: Collection[];
  setCollections: (collections: Collection[]) => void;
  collectionDetails: Map<string, CollectionFull>;
  setCollectionDetails: (details: Map<string, CollectionFull>) => void;
  environments: Environment[];
  setEnvironments: (environments: Environment[]) => void;

  // Loading states
  collectionsLoading: boolean;
  setCollectionsLoading: (loading: boolean) => void;
  environmentsLoading: boolean;
  setEnvironmentsLoading: (loading: boolean) => void;

  // Data operations
  loadCollections: () => Promise<void>;
  loadEnvironments: () => Promise<void>;
  loadCollectionDetails: (collectionId: string) => Promise<CollectionFull>;
  searchCollections: (query: string) => Promise<Collection[]>;
  saveCollection: (
    collection: Omit<Collection, "_id" | "size" | "createdAt">
  ) => Promise<Collection>;
  updateCollection: (
    collectionId: string,
    updates: Partial<Collection>
  ) => Promise<Collection>;
  deleteCollection: (collectionId: string) => Promise<void>;
  saveRequest: (
    collectionId: string,
    request: Omit<
      HttpRequest,
      "_id" | "createdAt" | "updatedAt" | "collectionId"
    >
  ) => Promise<HttpRequest>;
  updateRequest: (
    collectionId: string,
    requestId: string,
    updates: Partial<HttpRequest>
  ) => Promise<HttpRequest>;
  deleteRequest: (collectionId: string, requestId: string) => Promise<void>;
  saveEnvironment: (
    environment: Omit<Environment, "_id" | "createdAt" | "isActive">
  ) => Promise<Environment>;
  toggleEnvironmentOnCache: (environmentId: string) => void;
  updateEnvironment: (
    environmentId: string,
    updates: Omit<Environment, "_id" | "isActive" | "createdAt">
  ) => Promise<Environment>;
  updateEnvironmentVariable: (
    environmentId: string,
    key: string,
    value: string
  ) => void;
  deleteEnvironment: (environmentId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Active states
  const [activeRequest, setActiveRequest] = useState<HttpRequest | null>(null);
  const [activeEnvironments, setActiveEnvironments] = useState<Environment[]>(
    []
  );

  // UI states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("collections");

  // Data states (in memory)
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionDetails, setCollectionDetails] = useState<
    Map<string, CollectionFull>
  >(new Map());
  const [environments, setEnvironments] = useState<Environment[]>([]);

  // Loading states
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);

  // Initialize schedules and load data on mount
  useEffect(() => {
    scheduleService.initializeSchedules();
    loadCollections();
    loadEnvironments();

    // Set up environment update callback for schedules
    scheduleService.setEnvironmentUpdateCallback((environmentId: string, key: string, value: string) => {
      console.log(`[AppContext] Received environment update from schedule: ${key} = ${value} in environment ${environmentId}`);
      updateEnvironmentVariable(environmentId, key, value);
    });

    // Cleanup schedules on unmount
    return () => {
      scheduleService.cleanup();
    };
  }, []);

  // Update active environments when environments change
  useEffect(() => {
    const activeEnvs = environments.filter((env) => env.isActive);
    setActiveEnvironments(activeEnvs);
    scheduleService.setActiveEnvironmentsForSchedule(activeEnvs);
  }, [environments]);

  // Data operations
  const loadCollections = async () => {
    setCollectionsLoading(true);
    try {
      const fetchedCollections = await apiService.getCollections();
      setCollections(fetchedCollections);
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const loadEnvironments = async () => {
    setEnvironmentsLoading(true);
    try {
      const fetchedEnvironments = await apiService.getEnvironments();
      setEnvironments(fetchedEnvironments);
    } catch (error) {
      console.error("Error loading environments:", error);
    } finally {
      setEnvironmentsLoading(false);
    }
  };

  const loadCollectionDetails = async (
    collectionId: string
  ): Promise<CollectionFull> => {
    try {
      // Check if we already have the details cached
      const cached = collectionDetails.get(collectionId);
      if (cached) {
        return cached;
      }

      const details = await apiService.getCollectionById(collectionId);

      // Cache the details
      setCollectionDetails((prev) => {
        const newMap = new Map(prev);
        newMap.set(collectionId, details);
        return newMap;
      });

      return details;
    } catch (error) {
      console.error("Error loading collection details:", error);
      throw error;
    }
  };

  const searchCollections = async (query: string): Promise<Collection[]> => {
    try {
      return await apiService.searchCollections(query);
    } catch (error) {
      console.error("Error searching collections:", error);
      return [];
    }
  };

  const saveCollection = async (
    collection: Omit<Collection, "_id" | "size" | "createdAt">
  ): Promise<Collection> => {
    try {
      const newCollection = await apiService.createCollection(collection);
      setCollections((prev) => [...prev, newCollection]);
      loadCollectionDetails(newCollection._id);
      return newCollection;
    } catch (error) {
      console.error("Error creating collection:", error);
      throw error;
    }
  };

  const updateCollection = async (
    collectionId: string,
    updates: Partial<Collection>
  ): Promise<Collection> => {
    try {
      const updatedCollection = await apiService.updateCollection(
        collectionId,
        updates
      );
      setCollections((prev) =>
        prev.map((c) => (c._id === collectionId ? updatedCollection : c))
      );

      // Update cached details if they exist
      const cachedDetails = collectionDetails.get(collectionId);
      if (cachedDetails) {
        setCollectionDetails((prev) => {
          const newMap = new Map(prev);
          newMap.set(collectionId, { ...cachedDetails, ...updates });
          return newMap;
        });
      }

      return updatedCollection;
    } catch (error) {
      console.error("Error updating collection:", error);
      throw error;
    }
  };

  const deleteCollection = async (collectionId: string): Promise<void> => {
    try {
      await apiService.deleteCollection(collectionId);
      setCollections((prev) => prev.filter((c) => c._id !== collectionId));

      // Remove from cache
      setCollectionDetails((prev) => {
        const newMap = new Map(prev);
        newMap.delete(collectionId);
        return newMap;
      });
    } catch (error) {
      console.error("Error deleting collection:", error);
      throw error;
    }
  };

  const saveRequest = async (
    collectionId: string,
    request: Omit<
      HttpRequest,
      "_id" | "createdAt" | "updatedAt" | "collectionId"
    >
  ): Promise<HttpRequest> => {
    try {
      const newRequest = await apiService.createRequest(collectionId, request);

      // Update collection size
      setCollections((prev) =>
        prev.map((c) =>
          c._id === collectionId ? { ...c, size: c.size + 1 } : c
        )
      );

      // Update cached details
      const cachedDetails = collectionDetails.get(collectionId);
      if (cachedDetails) {
        setCollectionDetails((prev) => {
          const newMap = new Map(prev);
          newMap.set(collectionId, {
            ...cachedDetails,
            requests: [...cachedDetails.requests, newRequest],
          });
          return newMap;
        });
      }

      return newRequest;
    } catch (error) {
      console.error("Error creating request:", error);
      throw error;
    }
  };

  const updateRequest = async (
    collectionId: string,
    requestId: string,
    updates: Partial<HttpRequest>
  ): Promise<HttpRequest> => {
    try {
      const updatedRequest = await apiService.updateRequest(
        collectionId,
        requestId,
        updates
      );

      // Update cached details
      const cachedDetails = collectionDetails.get(collectionId);
      if (cachedDetails) {
        setCollectionDetails((prev) => {
          const newMap = new Map(prev);
          newMap.set(collectionId, {
            ...cachedDetails,
            requests: cachedDetails.requests.map((r) =>
              r._id === requestId ? updatedRequest : r
            ),
          });
          return newMap;
        });
      }

      // Update active request if it's the one being updated
      if (activeRequest?._id === requestId) {
        setActiveRequest(updatedRequest);
      }

      return updatedRequest;
    } catch (error) {
      console.error("Error updating request:", error);
      throw error;
    }
  };

  const deleteRequest = async (
    collectionId: string,
    requestId: string
  ): Promise<void> => {
    try {
      await apiService.deleteRequest(collectionId, requestId);

      // Update collection size
      setCollections((prev) =>
        prev.map((c) =>
          c._id === collectionId ? { ...c, size: Math.max(0, c.size - 1) } : c
        )
      );

      // Update cached details
      const cachedDetails = collectionDetails.get(collectionId);
      if (cachedDetails) {
        setCollectionDetails((prev) => {
          const newMap = new Map(prev);
          newMap.set(collectionId, {
            ...cachedDetails,
            requests: cachedDetails.requests.filter((r) => r._id !== requestId),
          });
          return newMap;
        });
      }

      // Clear active request if it was the deleted one
      if (activeRequest?._id === requestId) {
        setActiveRequest(null);
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      throw error;
    }
  };

  const saveEnvironment = async (
    environment: Omit<Environment, "_id" | "createdAt" | "isActive">
  ): Promise<Environment> => {
    try {
      const newEnvironment = await apiService.createEnvironment(environment);
      setEnvironments((prev) => [...prev, newEnvironment]);
      return newEnvironment;
    } catch (error) {
      console.error("Error creating environment:", error);
      throw error;
    }
  };

  const toggleEnvironmentOnCache = (environmentId: string) => {
    setEnvironments((prev) =>
      prev.map((e) =>
        e._id === environmentId ? { ...e, isActive: !e.isActive } : e
      )
    );
  };

  const updateEnvironment = async (
    environmentId: string,
    updates: Omit<Environment, "_id" | "isActive" | "createdAt">
  ): Promise<Environment> => {
    try {
      const { name, variables } = updates;
      const updatedEnvironment = await apiService.updateEnvironment(
        environmentId,
        { name, variables }
      );
      setEnvironments((prev) =>
        prev.map((e) => (e._id === environmentId ? updatedEnvironment : e))
      );
      return updatedEnvironment;
    } catch (error) {
      console.error("Error updating environment:", error);
      throw error;
    }
  };

  const updateEnvironmentVariable = (
    environmentId: string,
    key: string,
    value: string
  ) => {
    console.log(
      `[AppContext] Updating environment variable: ${key} = ${value} in environment ${environmentId}`
    );

    setEnvironments((prev) =>
      prev.map((env) => {
        if (env._id === environmentId) {
          const updatedEnv = {
            ...env,
            variables: {
              ...env.variables,
              [key]: value,
            },
          };
          console.log(`Environment ${env.name} updated:`, updatedEnv.variables);
          return updatedEnv;
        }
        return env;
      })
    );
  };

  const deleteEnvironment = async (environmentId: string): Promise<void> => {
    try {
      await apiService.deleteEnvironment(environmentId);
      setEnvironments((prev) => prev.filter((e) => e._id !== environmentId));
    } catch (error) {
      console.error("Error deleting environment:", error);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        // Active states
        activeRequest,
        setActiveRequest,
        activeEnvironments,
        setActiveEnvironments,

        // UI states
        sidebarCollapsed,
        setSidebarCollapsed,
        activeTab,
        setActiveTab,

        // Data states
        collections,
        setCollections,
        collectionDetails,
        setCollectionDetails,
        environments,
        setEnvironments,

        // Loading states
        collectionsLoading,
        setCollectionsLoading,
        environmentsLoading,
        setEnvironmentsLoading,

        // Data operations
        loadCollections,
        loadEnvironments,
        loadCollectionDetails,
        searchCollections,
        saveCollection,
        updateCollection,
        deleteCollection,
        saveRequest,
        updateRequest,
        deleteRequest,
        saveEnvironment,
        toggleEnvironmentOnCache,
        updateEnvironment,
        updateEnvironmentVariable,
        deleteEnvironment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}