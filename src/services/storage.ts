import { Schedule, ScheduleExecution } from "../types";

class StorageService {
  private prefix = "open_request_api_";

  // Schedules (localStorage only)
  saveSchedule(schedule: Schedule): void {
    const schedules = this.getSchedules();
    const index = schedules.findIndex((s) => s.id === schedule.id);

    if (index >= 0) {
      schedules[index] = { ...schedule, updatedAt: new Date().toISOString() };
    } else {
      schedules.push(schedule);
    }

    localStorage.setItem(`${this.prefix}schedules`, JSON.stringify(schedules));
  }

  getSchedules(): Schedule[] {
    const data = localStorage.getItem(`${this.prefix}schedules`);
    return data ? JSON.parse(data) : [];
  }

  deleteSchedule(id: string): void {
    const schedules = this.getSchedules().filter((s) => s.id !== id);
    localStorage.setItem(`${this.prefix}schedules`, JSON.stringify(schedules));

    // Also delete related executions
    const executions = this.getScheduleExecutions().filter(
      (e) => e.scheduleId !== id
    );
    localStorage.setItem(
      `${this.prefix}schedule_executions`,
      JSON.stringify(executions)
    );
  }

  // Schedule Executions (localStorage only)
  saveScheduleExecution(execution: ScheduleExecution): void {
    const executions = this.getScheduleExecutions();
    executions.unshift(execution); // Add to beginning for chronological order

    // Keep only last 100 executions to prevent storage bloat
    const trimmedExecutions = executions.slice(0, 100);

    localStorage.setItem(
      `${this.prefix}schedule_executions`,
      JSON.stringify(trimmedExecutions)
    );
  }

  getScheduleExecutions(): ScheduleExecution[] {
    const data = localStorage.getItem(`${this.prefix}schedule_executions`);
    return data ? JSON.parse(data) : [];
  }

  getScheduleExecutionsByScheduleId(scheduleId: string): ScheduleExecution[] {
    return this.getScheduleExecutions().filter(
      (e) => e.scheduleId === scheduleId
    );
  }

  deleteScheduleExecution(id: string): void {
    const executions = this.getScheduleExecutions().filter((e) => e.id !== id);
    localStorage.setItem(
      `${this.prefix}schedule_executions`,
      JSON.stringify(executions)
    );
  }
}

export const storageService = new StorageService();
