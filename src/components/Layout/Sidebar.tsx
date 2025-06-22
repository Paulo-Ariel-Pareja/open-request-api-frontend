import { useState, useEffect } from "react";
import {
  Folder,
  Plus,
  Search,
  Globe,
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  X,
  History,
  Timer,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useStorage } from "../../hooks/useStorage";
import { Collection, Schedule, Environment } from "../../types";
import { CollectionItem } from "./Collection/CollectionItem";
import { CollectionModal } from "./Collection/CollectionModal";
import { RequestModal } from "./Request/RequestModal";

export function Sidebar() {
  const {
    sidebarCollapsed,
    activeTab,
    setActiveTab,
    collections,
    environments,
    collectionsLoading,
    environmentsLoading,
    loadCollectionDetails,
    setActiveRequest,
    saveCollection,
    deleteCollection,
    saveRequest,
    deleteRequest,
    saveEnvironment,
    updateEnvironment,
    deleteEnvironment,
    toggleEnvironmentOnCache,
    searchCollections,
  } = useApp();

  const {
    schedules,
    scheduleExecutions,
    saveSchedule,
    deleteSchedule,
    executeSchedule,
  } = useStorage();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Collection[]>([]);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set()
  );
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(
    new Set()
  );

  // Modals and forms state
  // Collection
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  

  // Request
  const [showNewRequestForm, setShowNewRequestForm] = useState<string | null>(
    null
  );
  const [showNewEnvironmentForm, setShowNewEnvironmentForm] = useState(false);
  const [showNewScheduleForm, setShowNewScheduleForm] = useState(false);
  const [editingEnvironment, setEditingEnvironment] =
    useState<Environment | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Collection form state
/*   const [newCollection, setNewCollection] = useState({
    name: "",
    description: "",
  }); */

  // Request form state
/*   const [newRequest, setNewRequest] = useState({
    name: "",
    method: "GET" as const,
    url: "",
  }); */

  // Environment form state
  const [environmentForm, setEnvironmentForm] = useState({
    name: "",
    variables: [{ key: "", value: "" }],
  });

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    description: "",
    collections: [] as string[],
    interval: 60,
    enabled: true,
  });

  // Collection search for scheduler
  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");
  const [collectionSearchResults, setCollectionSearchResults] = useState<
    Collection[]
  >([]);
  const [showCollectionSearch, setShowCollectionSearch] = useState(false);

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        const results = await searchCollections(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchCollections]);

  // Collection search for scheduler
  useEffect(() => {
    const performCollectionSearch = async () => {
      if (collectionSearchQuery.trim()) {
        const results = await searchCollections(collectionSearchQuery);
        setCollectionSearchResults(results);
      } else {
        setCollectionSearchResults(collections);
      }
    };

    const debounceTimer = setTimeout(performCollectionSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [collectionSearchQuery, searchCollections, collections]);

  const toggleCollection = async (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
      // Load collection details when expanding
      try {
        await loadCollectionDetails(collectionId);
      } catch (error) {
        console.error("Error loading collection details:", error);
      }
    }
    setExpandedCollections(newExpanded);
  };

  const toggleSchedule = (scheduleId: string) => {
    const newExpanded = new Set(expandedSchedules);
    if (newExpanded.has(scheduleId)) {
      newExpanded.delete(scheduleId);
    } else {
      newExpanded.add(scheduleId);
    }
    setExpandedSchedules(newExpanded);
  };

/*   const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveCollection(newCollection);
      setNewCollection({ name: "", description: "" });
      setShowNewCollectionForm(false);
    } catch (error) {
      console.error("Error creating collection:", error);
    }
  }; */

/*   const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showNewRequestForm) return;

    try {
      const savedRequest = await saveRequest(showNewRequestForm, {
        ...newRequest,
        headers: {},
        body: "",
        bodyType: "none",
        preScript: "",
        postScript: "",
        tests: "",
      });
      setActiveRequest(savedRequest);
      setNewRequest({ name: "", method: "GET", url: "" });
      setShowNewRequestForm(null);
    } catch (error) {
      console.error("Error creating request:", error);
    }
  }; */

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const variables: Record<string, string> = {};
      environmentForm.variables.forEach((variable) => {
        if (variable.key.trim()) {
          variables[variable.key] = variable.value;
        }
      });

      await saveEnvironment({
        name: environmentForm.name,
        variables,
      });

      setEnvironmentForm({ name: "", variables: [{ key: "", value: "" }] });
      setShowNewEnvironmentForm(false);
    } catch (error) {
      console.error("Error creating environment:", error);
    }
  };

  const handleUpdateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnvironment) return;

    try {
      const variables: Record<string, string> = {};
      environmentForm.variables.forEach((variable) => {
        if (variable.key.trim()) {
          variables[variable.key] = variable.value;
        }
      });

      await updateEnvironment(editingEnvironment._id, {
        name: environmentForm.name,
        variables,
      });

      setEditingEnvironment(null);
      setShowNewEnvironmentForm(false);
      setEnvironmentForm({ name: "", variables: [{ key: "", value: "" }] });
    } catch (error) {
      console.error("Error updating environment:", error);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const schedule: Schedule = {
        id: Date.now().toString(),
        ...scheduleForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveSchedule(schedule);
      setScheduleForm({
        name: "",
        description: "",
        collections: [],
        interval: 60,
        enabled: true,
      });
      setShowNewScheduleForm(false);
      setShowCollectionSearch(false);
      setCollectionSearchQuery("");
    } catch (error) {
      console.error("Error creating schedule:", error);
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    try {
      const updatedSchedule: Schedule = {
        ...editingSchedule,
        ...scheduleForm,
        updatedAt: new Date().toISOString(),
      };

      saveSchedule(updatedSchedule);
      setScheduleForm({
        name: "",
        description: "",
        collections: [],
        interval: 60,
        enabled: true,
      });
      setShowNewScheduleForm(false);
      setShowCollectionSearch(false);
      setEditingSchedule(null);
      setCollectionSearchQuery("");
    } catch (error) {
      console.error("Error updating schedule:", error);
    }
  };

  const startEditingEnvironment = (environment: Environment) => {
    setEditingEnvironment(environment);
    setEnvironmentForm({
      name: environment.name,
      variables: Object.entries(environment.variables).map(([key, value]) => ({
        key,
        value,
      })),
    });
    setShowNewEnvironmentForm(true);
  };

  const startEditingSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      name: schedule.name,
      description: schedule.description,
      collections: schedule.collections,
      interval: schedule.interval,
      enabled: schedule.enabled,
    });
    setShowNewScheduleForm(true);
  };

  const addEnvironmentVariable = () => {
    setEnvironmentForm({
      ...environmentForm,
      variables: [...environmentForm.variables, { key: "", value: "" }],
    });
  };

  const updateEnvironmentVariable = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newVariables = [...environmentForm.variables];
    newVariables[index][field] = value;
    setEnvironmentForm({ ...environmentForm, variables: newVariables });
  };

  const removeEnvironmentVariable = (index: number) => {
    const newVariables = environmentForm.variables.filter(
      (_, i) => i !== index
    );
    if (newVariables.length === 0) {
      newVariables.push({ key: "", value: "" });
    }
    setEnvironmentForm({ ...environmentForm, variables: newVariables });
  };

  const toggleCollectionInSchedule = (collectionId: string) => {
    const newCollections = scheduleForm.collections.includes(collectionId)
      ? scheduleForm.collections.filter((id) => id !== collectionId)
      : [...scheduleForm.collections, collectionId];

    setScheduleForm({ ...scheduleForm, collections: newCollections });
  };

  const removeCollectionFromSchedule = (collectionId: string) => {
    setScheduleForm({
      ...scheduleForm,
      collections: scheduleForm.collections.filter((id) => id !== collectionId),
    });
  };

  const getSelectedCollectionNames = () => {
    return collections
      .filter((c) => scheduleForm.collections.includes(c._id))
      .map((c) => c.name);
  };

  const getScheduleExecutions = (scheduleId: string) => {
    return scheduleExecutions
      .filter((exec) => exec.scheduleId === scheduleId)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
      .slice(0, 4); // Only show last 4 executions
  };

  const formatExecutionTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = end.getTime() - start.getTime();

    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      return `${(duration / 60000).toFixed(1)}m`;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();

    if (diff < 60000) {
      return "Just now";
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return `${Math.floor(diff / 86400000)}d ago`;
    }
  };

  if (sidebarCollapsed) return;

  return (
    <div className="w-120 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab("collections")}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
            activeTab === "collections"
              ? "bg-gray-700 text-cyan-400 border-b-2 border-cyan-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <Folder size={16} />
          <span>Collections</span>
        </button>
        <button
          onClick={() => setActiveTab("environments")}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
            activeTab === "environments"
              ? "bg-gray-700 text-cyan-400 border-b-2 border-cyan-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <Globe size={16} />
          <span>Environments</span>
        </button>
        <button
          onClick={() => setActiveTab("schedules")}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
            activeTab === "schedules"
              ? "bg-gray-700 text-cyan-400 border-b-2 border-cyan-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <Clock size={16} />
          <span>Schedules</span>
        </button>
      </div>

      {/* Collections Tab */}
      {activeTab === "collections" && (
        <div className="flex-1 flex flex-col h-[calc(100vh-20rem)]">
          {/* Search and Add */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative mb-3">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={() => setShowNewCollectionForm(true)}
              className="w-full px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 flex items-center justify-center space-x-2 text-sm"
            >
              <Plus size={16} />
              <span>New Collection</span>
            </button>
          </div>

          {/* Collections List */}
          <div className="flex-1 overflow-y-auto">
            {collectionsLoading ? (
              <div className="p-4 text-center text-gray-400">
                Loading collections...
              </div>
            ) : (
              <div className="p-2">
                {(searchQuery ? searchResults : collections).map(
                  (collection) => (
                    <CollectionItem
                      key={collection._id}
                      collection={collection}
                      expanded={expandedCollections.has(collection._id)}
                      onToggle={() => toggleCollection(collection._id)}
                      onAddRequest={() => setShowNewRequestForm(collection._id)}
                      onDeleteCollection={() =>
                        deleteCollection(collection._id)
                      }
                      onSelectRequest={setActiveRequest}
                      onDeleteRequest={deleteRequest}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Environments Tab */}
      {activeTab === "environments" && (
        <div className="flex-1 flex flex-col h-[calc(100vh-20rem)]">
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={() => setShowNewEnvironmentForm(true)}
              className="w-full px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 flex items-center justify-center space-x-2 text-sm"
            >
              <Plus size={16} />
              <span>New Environment</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {environmentsLoading ? (
              <div className="p-4 text-center text-gray-400">
                Loading environments...
              </div>
            ) : (
              <div className="space-y-2">
                {environments.map((environment) => (
                  <div
                    key={environment._id}
                    className="p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            toggleEnvironmentOnCache(environment._id)
                          }
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            environment.isActive
                              ? "bg-green-500 border-green-500"
                              : "border-gray-500"
                          }`}
                        >
                          {environment.isActive && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </button>
                        <span className="text-white font-medium">
                          {environment.name}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEditingEnvironment(environment)}
                          className="p-1 text-gray-400 hover:text-cyan-400"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => deleteEnvironment(environment._id)}
                          className="p-1 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {Object.keys(environment.variables).length} variables
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === "schedules" && (
        <div className="flex-1 flex flex-col h-[calc(100vh-20rem)]">
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={() => setShowNewScheduleForm(true)}
              className="w-full px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 flex items-center justify-center space-x-2 text-sm"
            >
              <Plus size={16} />
              <span>New Schedule</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-2">
              {schedules.map((schedule) => {
                const executions = getScheduleExecutions(schedule.id);
                const isExpanded = expandedSchedules.has(schedule.id);

                return (
                  <div key={schedule.id} className="bg-gray-700 rounded-lg">
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              schedule.enabled ? "bg-green-500" : "bg-gray-500"
                            }`}
                          />
                          <span className="text-white font-medium">
                            {schedule.name}
                          </span>
                          {executions.length > 0 && (
                            <button
                              onClick={() => toggleSchedule(schedule.id)}
                              className="p-1 text-gray-400 hover:text-cyan-400"
                              title="View execution history"
                            >
                              <History size={14} />
                            </button>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => executeSchedule(schedule.id)}
                            className="p-1 text-gray-400 hover:text-green-400"
                            title="Run now"
                          >
                            <PlayCircle size={14} />
                          </button>
                          <button
                            onClick={() => startEditingSchedule(schedule)}
                            className="p-1 text-gray-400 hover:text-cyan-400"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => deleteSchedule(schedule.id)}
                            className="p-1 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Every {schedule.interval} minutes</div>
                        <div>{schedule.collections.length} collections</div>
                        {schedule.lastRun && (
                          <div className="flex items-center space-x-1">
                            {schedule.lastResult === "success" && (
                              <CheckCircle
                                size={12}
                                className="text-green-400"
                              />
                            )}
                            {schedule.lastResult === "error" && (
                              <XCircle size={12} className="text-red-400" />
                            )}
                            {schedule.lastResult === "partial" && (
                              <AlertCircle
                                size={12}
                                className="text-yellow-400"
                              />
                            )}
                            <span>
                              Last run: {formatRelativeTime(schedule.lastRun)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Execution History */}
                    {isExpanded && executions.length > 0 && (
                      <div className="border-t border-gray-600 p-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <History size={14} className="text-cyan-400" />
                          <span className="text-sm font-medium text-cyan-400">
                            Recent Executions (Last 4)
                          </span>
                        </div>
                        <div className="space-y-2">
                          {executions.map((execution) => (
                            <div
                              key={execution.id}
                              className="p-2 bg-gray-800 rounded text-xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  {execution.status === "success" && (
                                    <CheckCircle
                                      size={12}
                                      className="text-green-400"
                                    />
                                  )}
                                  {execution.status === "error" && (
                                    <XCircle
                                      size={12}
                                      className="text-red-400"
                                    />
                                  )}
                                  {execution.status === "partial" && (
                                    <AlertCircle
                                      size={12}
                                      className="text-yellow-400"
                                    />
                                  )}
                                  <span className="text-gray-300">
                                    {formatRelativeTime(execution.startTime)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-400">
                                  <Timer size={10} />
                                  <span>
                                    {formatExecutionTime(
                                      execution.startTime,
                                      execution.endTime
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-gray-400">
                                <span>
                                  {execution.successfulRequests}/
                                  {execution.totalRequests} requests
                                </span>
                                <span>
                                  {execution.collections.length} collections
                                </span>
                              </div>
                              {execution.error && (
                                <div className="mt-1 text-red-400 text-xs">
                                  Error: {execution.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {executions.length === 0 && (
                          <div className="text-center text-gray-500 text-xs py-2">
                            No executions yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* New Collection Form Modal */}
        <CollectionModal
        isOpen={showNewCollectionForm}
        onClose={() => setShowNewCollectionForm(false)}
        onSave={saveCollection}
      />

{/*       {showNewCollectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">
              New Collection
            </h3>
            <form onSubmit={handleCreateCollection}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newCollection.name}
                    onChange={(e) =>
                      setNewCollection({
                        ...newCollection,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCollection.description}
                    onChange={(e) =>
                      setNewCollection({
                        ...newCollection,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-20 resize-none"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewCollectionForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}

      {/* New Request Form Modal */}
     {showNewRequestForm && <RequestModal 
     collectionId={showNewRequestForm}
      onClose={() => setShowNewRequestForm(null)}
      />}
{/*       {showNewRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">
              New Request
            </h3>
            <form onSubmit={handleCreateRequest}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newRequest.name}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Method
                  </label>
                  <select
                    value={newRequest.method}
                    onChange={(e) =>
                      setNewRequest({
                        ...newRequest,
                        method: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    value={newRequest.url}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, url: e.target.value })
                    }
                    placeholder="https://api.example.com/endpoint"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewRequestForm(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}

      {/* Environment Form Modal */}
      {showNewEnvironmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-120 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingEnvironment ? "Edit Environment" : "New Environment"}
            </h3>
            <form
              onSubmit={
                editingEnvironment
                  ? handleUpdateEnvironment
                  : handleCreateEnvironment
              }
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={environmentForm.name}
                    onChange={(e) =>
                      setEnvironmentForm({
                        ...environmentForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Variables
                    </label>
                    <button
                      type="button"
                      onClick={addEnvironmentVariable}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                    >
                      <Plus size={12} />
                      <span>Add Variable</span>
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {environmentForm.variables.map((variable, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={variable.key}
                          onChange={(e) =>
                            updateEnvironmentVariable(
                              index,
                              "key",
                              e.target.value
                            )
                          }
                          placeholder="Variable name"
                          className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                        <input
                          type="text"
                          value={variable.value}
                          onChange={(e) =>
                            updateEnvironmentVariable(
                              index,
                              "value",
                              e.target.value
                            )
                          }
                          placeholder="Variable value"
                          className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeEnvironmentVariable(index)}
                          className="p-1 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewEnvironmentForm(false);
                    setEditingEnvironment(null);
                    setEnvironmentForm({
                      name: "",
                      variables: [{ key: "", value: "" }],
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
                >
                  {editingEnvironment ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Form Modal */}
      {showNewScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingSchedule ? "Edit Schedule" : "New Schedule"}
            </h3>
            <form
              onSubmit={
                editingSchedule ? handleUpdateSchedule : handleCreateSchedule
              }
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.name}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={scheduleForm.description}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-16 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Interval (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={scheduleForm.interval}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        interval: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Collections ({scheduleForm.collections.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowCollectionSearch(!showCollectionSearch)
                      }
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                    >
                      <Search size={12} />
                      <span>Browse Collections</span>
                    </button>
                  </div>

                  {/* Selected Collections */}
                  {scheduleForm.collections.length > 0 && (
                    <div className="mb-3 p-3 bg-gray-700 rounded-lg">
                      <div className="text-xs text-gray-400 mb-2">
                        Selected Collections:
                      </div>
                      <div className="space-y-1">
                        {getSelectedCollectionNames().map((name, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-white">{name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                removeCollectionFromSchedule(
                                  scheduleForm.collections[index]
                                )
                              }
                              className="text-gray-400 hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collection Search */}
                  {showCollectionSearch && (
                    <div className="border border-gray-600 rounded-lg p-3 bg-gray-700">
                      <div className="relative mb-3">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Search collections..."
                          value={collectionSearchQuery}
                          onChange={(e) =>
                            setCollectionSearchQuery(e.target.value)
                          }
                          className="w-full pl-9 pr-4 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {collectionSearchResults.map((collection) => (
                          <div
                            key={collection._id}
                            className="flex items-center justify-between p-2 hover:bg-gray-600 rounded cursor-pointer"
                            onClick={() =>
                              toggleCollectionInSchedule(collection._id)
                            }
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={scheduleForm.collections.includes(
                                  collection._id
                                )}
                                onChange={() =>
                                  toggleCollectionInSchedule(collection._id)
                                }
                                className="w-4 h-4 text-cyan-400 bg-gray-600 border-gray-500 rounded focus:ring-cyan-400"
                              />
                              <div>
                                <div className="text-sm text-white">
                                  {collection.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {collection.size} requests
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {collectionSearchResults.length === 0 &&
                          collectionSearchQuery && (
                            <div className="text-center text-gray-400 text-sm py-4">
                              No collections found
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={scheduleForm.enabled}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        enabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-cyan-400 bg-gray-700 border-gray-600 rounded focus:ring-cyan-400"
                  />
                  <label htmlFor="enabled" className="text-sm text-gray-300">
                    Enable schedule
                  </label>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewScheduleForm(false);
                    setEditingSchedule(null);
                    setScheduleForm({
                      name: "",
                      description: "",
                      collections: [],
                      interval: 60,
                      enabled: true,
                    });
                    setShowCollectionSearch(false);
                    setCollectionSearchQuery("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
                >
                  {editingSchedule ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
