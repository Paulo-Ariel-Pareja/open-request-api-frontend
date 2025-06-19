export interface HttpRequest {
  _id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Record<string, string>;
  body: string;
  bodyType: 'none' | 'json' | 'form' | 'raw';
  preScript: string;
  postScript: string;
  tests: string;
  pathVariables?: Record<string, string>;
  collectionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  _id: string;
  name: string;
  description: string;
  size: number;
  createdAt: string;
}

export interface CollectionFull {
  _id: string;
  name: string;
  description: string;
  requests: HttpRequest[];
  createdAt: string;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  scheduleName: string;
  startTime: string;
  endTime: string;
  status: 'success' | 'error' | 'partial';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  error?: string;
  collections: Array<{
    id: string;
    name: string;
    status: 'success' | 'error';
    requests: Array<{
      id: string;
      name: string;
      status: 'success' | 'error';
      error?: string;
      responseTime: number;
    }>;
  }>;
}

export interface Schedule {
  id: string;
  name: string;
  description: string;
  collections: string[];
  interval: number;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  lastResult?: 'success' | 'error' | 'partial';
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
  testResults?: TestResult[];
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface ExecutionResult {
  requestId: string;
  response?: RequestResponse;
  testResults: TestResult[];
  error?: string;
  timestamp: string;
}

export interface Environment {
  _id: string;
  name: string;
  variables: Record<string, string>;
  isActive: boolean;
  createdAt: string;
}