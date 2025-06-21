import { Schedule, ScheduleExecution, Environment } from '../types';
import { storageService } from './storage';
import { requestService } from './request';
import { apiService } from './api';

class ScheduleService {
  private runningSchedules = new Map<string, NodeJS.Timeout>();
  private onExecutionUpdate?: (execution: ScheduleExecution) => void;
  private onScheduleUpdate?: (schedule: Schedule) => void;
  private activeEnvironments: Environment[] = [];

  setActiveEnvironmentsForSchedule(environments: Environment[]) {
    console.log('env active: ', environments);
    this.activeEnvironments = environments;
  }

  setExecutionUpdateCallback(callback: (execution: ScheduleExecution) => void) {
    this.onExecutionUpdate = callback;
  }

  setScheduleUpdateCallback(callback: (schedule: Schedule) => void) {
    this.onScheduleUpdate = callback;
  }

  startSchedule(schedule: Schedule): void {
    if (this.runningSchedules.has(schedule.id)) {
      this.stopSchedule(schedule.id);
    }

    const intervalMs = schedule.interval * 60 * 1000; // Convert minutes to milliseconds
    
    const timeout = setInterval(async () => {
      await this.executeSchedule(schedule);
    }, intervalMs);

    this.runningSchedules.set(schedule.id, timeout);
  }

  stopSchedule(scheduleId: string): void {
    const timeout = this.runningSchedules.get(scheduleId);
    if (timeout) {
      clearInterval(timeout);
      this.runningSchedules.delete(scheduleId);
    }
  }

  async executeSchedule(schedule: Schedule): Promise<ScheduleExecution> {
    const startTime = new Date().toISOString();
    const execution: ScheduleExecution = {
      id: Date.now().toString(),
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      startTime,
      endTime: '',
      status: 'success',
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      collections: []
    };

    try {
      const activeEnvironments = this.activeEnvironments

      for (const collectionId of schedule.collections) {
        const collectionExecution = {
          id: collectionId,
          name: 'loading...',
          status: 'success' as 'success' | 'error',
          requests: [] as Array<{
            id: string;
            name: string;
            status: 'success' | 'error';
            error?: string;
            responseTime: number;
          }>
        };

        try {
          // Get collection details with requests
          const collectionDetails = await apiService.getCollectionById(collectionId);
          // Rename name on collectionExecution
          collectionExecution.name = collectionDetails.name;
          // Execute all requests in the collection
          for (const request of collectionDetails.requests) {
            execution.totalRequests++;
            const requestStartTime = Date.now();

            try {
              await requestService.executeRequest(request, activeEnvironments);
              const responseTime = Date.now() - requestStartTime;
              
              execution.successfulRequests++;
              collectionExecution.requests.push({
                id: request._id,
                name: request.name,
                status: 'success',
                responseTime
              });
            } catch (error) {
              const responseTime = Date.now() - requestStartTime;
              execution.failedRequests++;
              collectionExecution.status = 'error';
              
              collectionExecution.requests.push({
                id: request._id,
                name: request.name,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime
              });
            }
          }
        } catch (error) {
          collectionExecution.status = 'error';
          console.error(`Error loading collection ${collectionId}:`, error);
        }

        execution.collections.push(collectionExecution);
      }

      // Determine overall status
      if (execution.failedRequests === 0) {
        execution.status = 'success';
      } else if (execution.successfulRequests > 0) {
        execution.status = 'partial';
      } else {
        execution.status = 'error';
      }

    } catch (error) {
      execution.status = 'error';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
    }

    execution.endTime = new Date().toISOString();

    // Update schedule with last run info
    const updatedSchedule = {
      ...schedule,
      lastRun: execution.endTime,
      lastResult: execution.status,
      lastError: execution.error,
      updatedAt: new Date().toISOString()
    };
    storageService.saveSchedule(updatedSchedule);

    // Save execution
    storageService.saveScheduleExecution(execution);

    // Notify callbacks for real-time updates
    if (this.onExecutionUpdate) {
      this.onExecutionUpdate(execution);
    }
    if (this.onScheduleUpdate) {
      this.onScheduleUpdate(updatedSchedule);
    }

    return execution;
  }

  async executeScheduleOnce(scheduleId: string): Promise<ScheduleExecution> {
    const schedule = storageService.getSchedules().find(s => s.id === scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    return this.executeSchedule(schedule);
  }

  initializeSchedules(): void {
    const schedules = storageService.getSchedules();
    schedules.forEach(schedule => {
      if (schedule.enabled) {
        this.startSchedule(schedule);
      }
    });
  }

  updateSchedule(schedule: Schedule): void {
    // Stop existing schedule if running
    this.stopSchedule(schedule.id);
    
    // Start new schedule if enabled
    if (schedule.enabled) {
      this.startSchedule(schedule);
    }
  }

  cleanup(): void {
    // Stop all running schedules
    this.runningSchedules.forEach((timeout, scheduleId) => {
      this.stopSchedule(scheduleId);
    });
  }
}

export const scheduleService = new ScheduleService();