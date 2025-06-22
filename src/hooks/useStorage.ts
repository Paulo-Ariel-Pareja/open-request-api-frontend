import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storage';
import { scheduleService } from '../services/schedule';
import { Schedule, ScheduleExecution } from '../types';

export function useStorage() {
  // Only schedules and executions are stored in localStorage
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleExecutions, setScheduleExecutions] = useState<ScheduleExecution[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    try {
      setSchedules(storageService.getSchedules());
      setScheduleExecutions(storageService.getScheduleExecutions());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Set up real-time update callbacks
    scheduleService.setExecutionUpdateCallback((execution: ScheduleExecution) => {
      setScheduleExecutions(storageService.getScheduleExecutions());
    });

    scheduleService.setScheduleUpdateCallback((schedule: Schedule) => {
      setSchedules(storageService.getSchedules());
    });

    // Listen for localStorage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('open_request_api_')) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  const saveSchedule = useCallback((schedule: Schedule) => {
    storageService.saveSchedule(schedule);
    setSchedules(storageService.getSchedules());
    
    // Update the schedule service
    scheduleService.updateSchedule(schedule);
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    // Stop the schedule first
    scheduleService.stopSchedule(id);
    
    storageService.deleteSchedule(id);
    setSchedules(storageService.getSchedules());
    setScheduleExecutions(storageService.getScheduleExecutions());
  }, []);

  const saveScheduleExecution = useCallback((execution: ScheduleExecution) => {
    storageService.saveScheduleExecution(execution);
    setScheduleExecutions(storageService.getScheduleExecutions());
  }, []);

  const deleteScheduleExecution = useCallback((id: string) => {
    storageService.deleteScheduleExecution(id);
    setScheduleExecutions(storageService.getScheduleExecutions());
  }, []);

  const executeSchedule = useCallback(async (scheduleId: string) => {
    try {
      const execution = await scheduleService.executeScheduleOnce(scheduleId);
      // The callbacks will handle updating the state
      return execution;
    } catch (error) {
      console.error('Error executing schedule:', error);
      throw error;
    }
  }, []);

  return {
    schedules,
    scheduleExecutions,
    loading,
    saveSchedule,
    deleteSchedule,
    saveScheduleExecution,
    deleteScheduleExecution,
    executeSchedule,
    refresh: loadData,
  };
}