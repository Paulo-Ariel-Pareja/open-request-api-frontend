import { Folder, Globe, Clock } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { CollectionTab } from "./Collection/CollectionTab";
import { EnvironmentTab } from "./Environment/EnvironmentTab";
import { ScheduleTab } from "./Schedule/ScheduleTab";

export function Sidebar() {
  const { sidebarCollapsed, activeTab, setActiveTab } = useApp();

  if (sidebarCollapsed) return;

  return (
    <div className="w-120 bg-gray-800 border-r border-gray-700 flex flex-col">
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
      {activeTab === "collections" && <CollectionTab />}

      {/* Environments Tab */}
      {activeTab === "environments" && <EnvironmentTab />}

      {/* Schedules Tab */}
      {activeTab === "schedules" && <ScheduleTab />}
    </div>
  );
}
