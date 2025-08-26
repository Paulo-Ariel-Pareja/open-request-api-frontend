import {
  HttpRequest,
  RequestResponse,
  Environment,
  TestResult,
} from "../types";

class RequestService {
  async executeRequest(
    request: HttpRequest,
    environments: Environment[] = [],
    onEnvironmentUpdate?: (
      environmentId: string,
      key: string,
      value: string
    ) => void
  ): Promise<RequestResponse> {
    const startTime = Date.now();

    try {
      // Merge all active environment variables
      const mergedVariables: Record<string, string> = {};
      environments.forEach((env) => {
        Object.assign(mergedVariables, env.variables);
      });

      // Create enhanced context for scripts
      const scriptContext = {
        environments,
        variables: mergedVariables,
        request,
        updateEnvironmentVariable: (
          key: string,
          value: string,
          environmentName?: string
        ) => {
          // Update the merged variables for immediate use
          mergedVariables[key] = value;

          // Find the target environment
          let targetEnv: Environment | undefined;

          if (environmentName) {
            // Find environment by name
            targetEnv = environments.find(
              (env) => env.name === environmentName
            );
          } else {
            // Use the first active environment, or first environment if none active
            targetEnv =
              environments.find((env) => env.isActive) || environments[0];
          }

          if (targetEnv && onEnvironmentUpdate) {
            // Call the callback to update the environment in the context
            onEnvironmentUpdate(targetEnv._id, key, value);
          }
        },
      };

      // Execute pre-request script if present
      if (request.preScript?.trim()) {
        try {
          await this.executeScript(request.preScript, scriptContext);
        } catch (error) {
          console.warn("Pre-request script error:", error);
        }
      }

      // Replace environment variables in URL and body
      let url = this.replaceVariables(request.url, mergedVariables);
      url = this.replacePathVariables(url, request.pathVariables);
      url = this.replaceVariables(url, mergedVariables);
      let body = this.replaceVariables(request.body, mergedVariables);

      // Prepare headers
      const headers: Record<string, string> = { ...request.headers };

      // Replace environment variables in headers
      Object.keys(headers).forEach((key) => {
        headers[key] = this.replaceVariables(headers[key], mergedVariables);
      });

      // Handle form data
      let formData: FormData | undefined;
      if (request.bodyType === "form" && body) {
        try {
          const formFields = JSON.parse(body);
          if (Array.isArray(formFields)) {
            formData = new FormData();

            // Get stored files from global variable
            const storedFiles = (window as any).__formDataFiles || {};

            formFields.forEach((field: any, index: number) => {
              if (field.enabled && field.key) {
                if (field.type === "file") {
                  // Try to get the real file from storage
                  const fileKey = `${field.key}_${index}`;
                  const realFile = storedFiles[fileKey];

                  if (realFile && realFile instanceof File) {
                    // Use the real file
                    formData!.append(field.key, realFile);
                  } else if (field.fileName) {
                    // Fallback: create a mock file with the stored filename
                    const mockFile = new File(
                      ["[File content not available in demo]"],
                      field.fileName,
                      {
                        type: field.fileType || "application/octet-stream",
                      }
                    );
                    formData!.append(field.key, mockFile);
                  }
                } else {
                  // Text field - replace environment variables in the value
                  const processedValue = this.replaceVariables(
                    field.value || "",
                    mergedVariables
                  );
                  formData!.append(field.key, processedValue);
                }
              }
            });

            // Don't set Content-Type for FormData - browser will set it with boundary
            delete headers["Content-Type"];
            body = ""; // Clear body since we're using FormData
          }
        } catch (error) {
          console.warn("Error parsing form data:", error);
          // Fall back to URL encoded
          headers["Content-Type"] = "application/x-www-form-urlencoded";

          // Convert JSON form data to URL encoded format
          try {
            const formFields = JSON.parse(body);
            if (Array.isArray(formFields)) {
              const urlEncodedData = formFields
                .filter(
                  (field: any) =>
                    field.enabled && field.key && field.type === "text"
                )
                .map((field: any) => {
                  const processedValue = this.replaceVariables(
                    field.value || "",
                    mergedVariables
                  );
                  return `${encodeURIComponent(field.key)}=${encodeURIComponent(
                    processedValue
                  )}`;
                })
                .join("&");
              body = urlEncodedData;
            }
          } catch {
            // Keep original body if parsing fails
          }
        }
      } else if (request.bodyType === "json" && body) {
        headers["Content-Type"] = "application/json";
      } else if (request.bodyType === "form" && body) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      }

      // Prepare fetch options
      const options: RequestInit = {
        method: request.method,
        headers,
      };

      // Add body if not GET/HEAD
      if (request.method !== "GET" && request.method !== "HEAD") {
        if (formData) {
          options.body = formData;

          // Log FormData contents for debugging
          for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
              console.log(
                `FormData field: ${key} = File(${value.name}, ${value.size} bytes, ${value.type})`
              );
            } else {
              console.log(`FormData field: ${key} = ${value}`);
            }
          }
        } else if (body) {
          if (request.bodyType === "json") {
            try {
              JSON.parse(body); // Validate JSON
              options.body = body;
            } catch {
              throw new Error("Invalid JSON body");
            }
          } else {
            options.body = body;
          }
        }
      }

      // Execute request
      const response = await fetch(url, options);
      const endTime = Date.now();

      if (!response.ok) {
        // Get error response data
        let errorData: any;
        const contentType = response.headers.get("content-type") || "";
        
        if (contentType.includes("application/json")) {
          try {
            errorData = await response.json();
          } catch {
            errorData = await response.text();
          }
        } else {
          errorData = await response.text();
        }

        // Throw an error with the response details
        const error = new Error(errorData);
        (error as any).status = response.status;
        (error as any).headers = response.headers;
        throw error;
      }

      // Get response data
      let data: any;
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
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
        testResults: [],
      };

      // Update script context with response
      const postScriptContext = {
        ...scriptContext,
        response: requestResponse,
      };

      // Execute post-response script if present
      if (request.postScript?.trim()) {
        try {
          await this.executeScript(request.postScript, postScriptContext);
        } catch (error) {
          console.warn("Post-response script error:", error);
        }
      }

      // Execute tests if present
      if (request.tests?.trim()) {
        try {
          const testResults = await this.executeTests(
            request.tests,
            postScriptContext
          );
          requestResponse.testResults = testResults;
        } catch (error) {
          console.warn("Test execution error:", error);
          requestResponse.testResults = [
            {
              name: "Test Execution Error",
              passed: false,
              error:
                error instanceof Error ? error.message : "Unknown test error",
            },
          ];
        }
      }

      return requestResponse;
    } catch (error) {
      const endTime = Date.now();
      console.error("Request execution error:", error);
      throw {
        status: error?.status || 0,
        statusText: error?.message || "Network Error",
        headers: error?.headers || {},
        data: error instanceof Error ? error.message : "Unknown error",
        time: endTime - startTime,
        size: 0,
        testResults: [],
      };
    }
  }

  private calculateSize(data: any): number {
    if (typeof data === "string") {
      return new Blob([data]).size;
    }
    return new Blob([JSON.stringify(data)]).size;
  }

  private replaceVariables(
    text: string,
    variables: Record<string, string>
  ): string {
    return text.replace(/\{\{([\w-]+)\}\}/g, (match, varName) => {
      const value = variables[varName];
      if (value !== undefined) {
        return value;
      }
      console.warn(`Variable {{${varName}}} not found in environment`);
      return match;
    });
  }

  private replacePathVariables(
    url: string,
    pathVariables: Record<string, string> = {}
  ): string {
    let processedUrl = url;
    
    // Replace path variables like :id, :name, etc.
    Object.entries(pathVariables).forEach(([key, value]) => {
      const pathVariablePattern = new RegExp(`:${key}(?=/|$)`, 'g');
      processedUrl = processedUrl.replace(pathVariablePattern, value);
    });
    
    return processedUrl;
  }

  async executeScript(script: string, context: any = {}): Promise<any> {
    try {
      // Create a sandboxed execution context
      const func = new Function("pm", "response", "environments", script);

      // Mock pm object for scripting
      const pm = {
        test: (name: string, fn: () => void) => {
          try {
            fn();
            return { name, passed: true };
          } catch (error) {
            return {
              name,
              passed: false,
              error: error instanceof Error ? error.message : "Test failed",
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
                  throw new Error(
                    `Expected status ${expected} but got ${context.response?.status}`
                  );
                }
              },
            },
          },
        }),
        response: context.response
          ? {
              status: context.response.status,
              headers: context.response.headers,
              data: context.response.data,
              json: () => context.response.data,
              text: () =>
                typeof context.response.data === "string"
                  ? context.response.data
                  : JSON.stringify(context.response.data),
            }
          : undefined,
        environment: {
          get: (key: string) => {
            const value = context.variables?.[key];
            return value;
          },
          set: (key: string, value: string, environmentName?: string) => {
            if (context.updateEnvironmentVariable) {
              context.updateEnvironmentVariable(key, value, environmentName);
            }
            if (context.variables) {
              context.variables[key] = value;
            }
          },
        },
        globals: {
          get: (key: string) => {
            const value = context.variables?.[key];
            return value;
          },
          set: (key: string, value: string, environmentName?: string) => {
            if (context.updateEnvironmentVariable) {
              context.updateEnvironmentVariable(key, value, environmentName);
            }
            if (context.variables) {
              context.variables[key] = value;
            }
          },
        },
      };

      return func(pm, context.response, context.environments);
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Script execution failed");
    }
  }

  async executeTests(
    testScript: string,
    context: any = {}
  ): Promise<TestResult[]> {
    const testResults: TestResult[] = [];

    try {
      // Create a sandboxed execution context for tests
      const func = new Function("pm", "response", "environments", testScript);

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
              error: error instanceof Error ? error.message : "Test failed",
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
                  throw new Error(
                    `Expected status ${expected} but got ${context.response?.status}`
                  );
                }
              },
              property: (prop: string) => {
                if (
                  typeof context.response?.data !== "object" ||
                  !(prop in context.response.data)
                ) {
                  throw new Error(
                    `Expected response to have property '${prop}'`
                  );
                }
                return {
                  that: {
                    equals: (expected: any) => {
                      if (context.response.data[prop] !== expected) {
                        throw new Error(
                          `Expected property '${prop}' to equal ${expected} but got ${context.response.data[prop]}`
                        );
                      }
                    },
                  },
                };
              },
            },
            be: {
              ok: () => {
                if (
                  context.response?.status < 200 ||
                  context.response?.status >= 300
                ) {
                  throw new Error(
                    `Expected response to be ok but got status ${context.response?.status}`
                  );
                }
              },
            },
          },
        }),
        response: {
          status: context.response?.status,
          headers: context.response?.headers,
          data: context.response?.data,
          json: () => context.response?.data,
          text: () =>
            typeof context.response?.data === "string"
              ? context.response?.data
              : JSON.stringify(context.response?.data),
          to: {
            have: {
              status: (expected: number) => {
                if (context.response?.status !== expected) {
                  throw new Error(
                    `Expected status ${expected} but got ${context.response?.status}`
                  );
                }
              },
              jsonBody: () => {
                const contentType =
                  context.response?.headers["content-type"] || "";
                if (!contentType.includes("application/json")) {
                  throw new Error("Expected response to have JSON body");
                }
              },
            },
          },
        },
        environment: {
          get: (key: string) => {
            const value = context.variables?.[key];
            return value;
          },
          set: (key: string, value: string, environmentName?: string) => {
            if (context.updateEnvironmentVariable) {
              context.updateEnvironmentVariable(key, value, environmentName);
            }
            if (context.variables) {
              context.variables[key] = value;
            }
          },
        },
        globals: {
          get: (key: string) => {
            const value = context.variables?.[key];
            return value;
          },
          set: (key: string, value: string, environmentName?: string) => {
            if (context.updateEnvironmentVariable) {
              context.updateEnvironmentVariable(key, value, environmentName);
            }
            if (context.variables) {
              context.variables[key] = value;
            }
          },
        },
      };

      // Execute the test script
      func(pm, context.response, context.environments);
    } catch (error) {
      // If there's a syntax error or other issue with the test script itself
      testResults.push({
        name: "Test Script Error",
        passed: false,
        error:
          error instanceof Error
            ? error.message
            : "Test script execution failed",
      });
    }

    return testResults;
  }
}

export const requestService = new RequestService();
