import { useState } from "react";
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
  History,
  Timer,
} from "lucide-react";
import { useStorage } from "../../../hooks/useStorage";
import { Schedule } from "../../../types";
import { ScheduleModal } from "./ScheduleModal";

export function ScheduleTab() {
  const {
    schedules,
    scheduleExecutions,
    saveSchedule,
    deleteSchedule,
    executeSchedule,
  } = useStorage();

  const [showNewScheduleForm, setShowNewScheduleForm] = useState(false);
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(
    new Set()
  );
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const toggleSchedule = (scheduleId: string) => {
    const newExpanded = new Set(expandedSchedules);
    if (newExpanded.has(scheduleId)) {
      newExpanded.delete(scheduleId);
    } else {
      newExpanded.add(scheduleId);
    }
    setExpandedSchedules(newExpanded);
  };

  const startEditingSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowNewScheduleForm(true);
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

  return (
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
                          <CheckCircle size={12} className="text-green-400" />
                        )}
                        {schedule.lastResult === "error" && (
                          <XCircle size={12} className="text-red-400" />
                        )}
                        {schedule.lastResult === "partial" && (
                          <AlertCircle size={12} className="text-yellow-400" />
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
                                <XCircle size={12} className="text-red-400" />
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
      {/* Schedule Form Modal */}
      {showNewScheduleForm && (
        <ScheduleModal
          editingSchedule={editingSchedule}
          onSave={saveSchedule}
          onClose={() => {
            setShowNewScheduleForm(false);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
}
