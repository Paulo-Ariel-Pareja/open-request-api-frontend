import { HttpRequest, RequestResponse, Environment, TestResult } from '../types';

class RequestService {
  async executeRequest(
    request: HttpRequest, 
    environments: Environment[] = []
  ): Promise<RequestResponse> {
    const startTime = Date.now();
    
    try {
      // Merge all active environment variables
      const mergedVariables: Record<string, string> = {};
      environments.forEach(env => {
        Object.assign(mergedVariables, env.variables);
      });

      // Create enhanced context for scripts
      const scriptContext = {
        environments,
        variables: mergedVariables,
        request,
        updateEnvironmentVariable: (key: string, value: string, environmentName?: string) => {
          // Note: In the new architecture, we can't directly update environments from here
          // This would need to be handled differently, perhaps through callbacks
          console.log(`Would update environment variable ${key} = ${value} in ${environmentName || 'default'}`);
          
          // Update the merged variables for immediate use
          mergedVariables[key] = value;
        }
      };

      // Execute pre-request script if present
      if (request.preScript?.trim()) {
        try {
          await this.executeScript(request.preScript, scriptContext);
        } catch (error) {
          console.warn('Pre-request script error:', error);
        }
      }

      // Replace environment variables in URL and body
      const url = this.replaceVariables(request.url, mergedVariables);
      const body = this.replaceVariables(request.body, mergedVariables);
      
      // Prepare headers
      const headers: Record<string, string> = { ...request.headers };
      
      // Replace environment variables in headers
      Object.keys(headers).forEach(key => {
        headers[key] = this.replaceVariables(headers[key], mergedVariables);
      });
      
      // Set content type based on body type
      if (request.bodyType === 'json' && body) {
        headers['Content-Type'] = 'application/json';
      } else if (request.bodyType === 'form' && body) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      // Prepare fetch options
      const options: RequestInit = {
        method: request.method,
        headers,
      };

      // Add body if not GET/HEAD
      if (request.method !== 'GET' && request.method !== 'HEAD' && body) {
        if (request.bodyType === 'json') {
          try {
            JSON.parse(body); // Validate JSON
            options.body = body;
          } catch {
            throw new Error('Invalid JSON body');
          }
        } else {
          options.body = body;
        }
      }

      // Execute request
      const response = await fetch(url, options);
      const endTime = Date.now();
      
      // Get response data
      let data: any;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }
      } else {
        data = await response.text();
      }

      // Prepare response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const requestResponse: RequestResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        time: endTime - startTime,
        size: this.calculateSize(data),
        testResults: []
      };

      // Update script context with response
      const postScriptContext = {
        ...scriptContext,
        response: requestResponse
      };

      // Execute post-response script if present
      if (request.postScript?.trim()) {
        try {
          await this.executeScript(request.postScript, postScriptContext);
        } catch (error) {
          console.warn('Post-response script error:', error);
        }
      }

      // Execute tests if present
      if (request.tests?.trim()) {
        try {
          const testResults = await this.executeTests(request.tests, postScriptContext);
          requestResponse.testResults = testResults;
        } catch (error) {
          console.warn('Test execution error:', error);
          requestResponse.testResults = [{
            name: 'Test Execution Error',
            passed: false,
            error: error instanceof Error ? error.message : 'Unknown test error'
          }];
        }
      }

      return requestResponse;
    } catch (error) {
      const endTime = Date.now();
      throw {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: error instanceof Error ? error.message : 'Unknown error',
        time: endTime - startTime,
        size: 0,
        testResults: []
      };
    }
  }

  private calculateSize(data: any): number {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }
    return new Blob([JSON.stringify(data)]).size;
  }

  private replaceVariables(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] || match;
    });
  }

  async executeScript(script: string, context: any = {}): Promise<any> {
    try {
      // Create a sandboxed execution context
      const func = new Function('pm', 'response', 'environments', script);
      
      // Mock pm object for Postman-like scripting
      const pm = {
        test: (name: string, fn: () => void) => {
          try {
            fn();
            return { name, passed: true };
          } catch (error) {
            return { 
              name, 
              passed: false, 
              error: error instanceof Error ? error.message : 'Test failed' 
            };
          }
        },
        expect: (actual: any) => ({
          to: {
            equal: (expected: any) => {
              if (actual !== expected) {
                throw new Error(`Expected ${expected} but got ${actual}`);
              }
            },
            have: {
              status: (expected: number) => {
                if (context.response?.status !== expected) {
                  throw new Error(`Expected status ${expected} but got ${context.response?.status}`);
                }
              }
            }
          }
        }),
        response: context.response ? {
          status: context.response.status,
          headers: context.response.headers,
          data: context.response.data,
          json: () => context.response.data,
          text: () => typeof context.response.data === 'string' ? context.response.data : JSON.stringify(context.response.data)
        } : undefined,
        environment: {
          get: (key: string) => context.variables?.[key],
          set: (key: string, value: string, environmentName?: string) => {
            if (context.updateEnvironmentVariable) {
              context.updateEnvironmentVariable(key, value, environmentName);
            }
            if (context.variables) {
              context.variables[key] = value;
            }
          }
        },
        globals: {
          get: (key: string) => context.variables?.[key],
          set: (key: string, value: string, environmentName?: string) => {
            if (context.updateEnvironmentVariable) {
              context.updateEnvironmentVariable(key, value, environmentName);
            }
            if (context.variables) {
              context.variables[key] = value;
            }
          }
        }
      };

      return func(pm, context.response, context.environments);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Script execution failed');
    }
  }

  async executeTests(testScript: string, context: any = {}): Promise<TestResult[]> {
    const testResults: TestResult[] = [];
    
    try {
      // Create a sandboxed execution context for tests
      const func = new Function('pm', 'response', 'environments', testScript);
      
      // Mock pm object with test collection
      const pm = {
        test: (name: string, fn: () => void) => {
          try {
            fn();
            testResults.push({ name, passed: true });
          } catch (error) {
            testResults.push({ 
              name, 
              passed: false, 
              error: error instanceof Error ? error.message : 'Test failed' 
            });
          }
        },
        expect: (actual: any) => ({
          to: {
            equal: (expected: any) => {
              if (actual !== expected) {
                throw new Error(`Expected ${expected} but got ${actual}`);
              }
            },
            have: {
              status: (expected: number) => {
                if (context.response?.status !== expected) {
                  throw new Error(`Expected status ${expected} but got ${context.response?.status}`);
                }
              },
              property: (prop: string) => {
                if (typeof context.response?.data !== 'object' || !(prop in context.response.data)) {
                  throw new Error(`Expected response to have property '${prop}'`);
                }
                return {
                  that: {
                    equals: (expected: any) => {
                      if (context.response.data[prop] !== expected) {
                        throw new Error(`Expected property '${prop}' to equal ${expected} but got ${context.response.data[prop]}`);
                      }
                    }
                  }
                };
              }
            },
            be: {
              ok: () => {
                if (context.response?.status < 200 || context.response?.status >= 300) {
                  throw new Error(`Expected response to be ok but got status ${context.response?.status}`);
                }
              }
            }
          }
        }),
        response: {
          status: context.response?.status,
          headers: context.response?.headers,
          data: context.response?.data,
          json: () => context.response?.data,
          text: () => typeof context.response?.data === 'string' ? context.response?.data : JSON.stringify(context.response?.data),
          to: {
            have: {
              status: (expected: number) => {
                if (context.response?.status !== expected) {
                  throw new Error(`Expected status ${expected} but got ${context.response?.status}`);
                }
              },
              jsonBody: () => {
                const contentType = context.response?.headers['content-type'] || '';
                if (!contentType.includes('application/json')) {
                  throw new Error('Expected response to have JSON body');
                }
              }
            }
          }
        },
        environment: {
          get: (key: string) => context.variables?.[key],
          set: (key: string, value: string, environmentName?: string) => {
            if (context.updateEnvironmentVariable) {
              context.updateEnvironmentVariable(key, value, environmentName);
            }
            if (context.variables) {
              context.variables[key] = value;
            }
          }
        },
        globals: {
          get: (key: string) => context.variables?.[key],
          set: (key: string, value: string, environmentName?: string) => {
            if (context.updateEnvironmentVariable) {
              context.updateEnvironmentVariable(key, value, environmentName);
            }
            if (context.variables) {
              context.variables[key] = value;
            }
          }
        }
      };

      // Execute the test script
      func(pm, context.response, context.environments);
      
    } catch (error) {
      // If there's a syntax error or other issue with the test script itself
      testResults.push({
        name: 'Test Script Error',
        passed: false,
        error: error instanceof Error ? error.message : 'Test script execution failed'
      });
    }

    return testResults;
  }
}

export const requestService = new RequestService();