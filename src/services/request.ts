import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import {
  HttpRequest,
  RequestResponse,
  Environment,
  TestResult,
} from "../types";

class RequestService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 seconds timeout for requests
    });

    // Add response interceptor for better error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error("Request Error:", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private mergeEnvironmentVariables(
    environments: Environment[]
  ): Record<string, string> {
    const merged: Record<string, string> = {};
    environments.forEach((environment) => {
      Object.assign(merged, environment.variables);
    });
    return merged;
  }

  private buildScriptContext(
    request: HttpRequest,
    environments: Environment[],
    mergedVariables: Record<string, string>,
    onEnvironmentUpdate?: (
      environmentId: string,
      key: string,
      value: string
    ) => void
  ) {
    return {
      environments,
      variables: mergedVariables,
      request,
      updateEnvironmentVariable: (
        key: string,
        value: string,
        environmentName?: string
      ) => {
        mergedVariables[key] = value;
        let targetEnv: Environment | undefined;
        if (environmentName) {
          targetEnv = environments.find((env) => env.name === environmentName);
        } else {
          targetEnv = environments.find((env) => env.isActive) || environments[0];
        }
        if (targetEnv && onEnvironmentUpdate) {
          onEnvironmentUpdate(targetEnv._id, key, value);
        }
      },
    };
  }

  private async parseResponseBody(response: AxiosResponse): Promise<unknown> {
    return response.data;
  }

  private async parseErrorResponse(error: unknown): Promise<Error> {
    const axiosError = error as { response?: { data?: unknown; status?: number; headers?: unknown }; message?: string };
    const errorData = axiosError.response?.data || axiosError.message || "Request failed";
    const message = typeof errorData === "object" && errorData !== null && "message" in errorData
      ? String((errorData as { message?: unknown }).message || "Request failed")
      : typeof errorData === "string"
      ? errorData
      : "Request failed";
    
    type HttpError = Error & { status?: number; headers?: unknown };
    const httpError = new Error(message) as HttpError;
    httpError.status = axiosError.response?.status || 0;
    httpError.headers = axiosError.response?.headers || {};
    return httpError;
  }

  private buildHeadersWithVariables(
    baseHeaders: Record<string, string>,
    variables: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = { ...baseHeaders };
    Object.keys(headers).forEach((key) => {
      headers[key] = this.replaceVariables(headers[key], variables);
    });
    return headers;
  }

  private buildBodyAndHeaders(
    request: HttpRequest,
    mergedVariables: Record<string, string>,
    headers: Record<string, string>
  ): { body: string; formData?: FormData; headers: Record<string, string> } {
    let body = this.replaceVariables(request.body, mergedVariables);
    let formData: FormData | undefined;

    if (request.bodyType === "form" && body) {
      try {
        const parsed = JSON.parse(body) as unknown;
        if (Array.isArray(parsed)) {
          type FormField = {
            enabled?: boolean;
            key?: string;
            type?: string;
            value?: string;
            fileName?: string;
            fileType?: string;
          };
          const formFields = parsed as FormField[];
          formData = new FormData();
          const storedFiles =
            ((window as unknown as { __formDataFiles?: Record<string, File> })
              .__formDataFiles || {}) as Record<string, File>;
          formFields.forEach((field: FormField, index: number) => {
            if (field.enabled && field.key) {
              if (field.type === "file") {
                const fileKey = `${field.key}_${index}`;
                const realFile = storedFiles[fileKey];
                if (realFile && realFile instanceof File) {
                  formData!.append(field.key, realFile);
                } else if (field.fileName) {
                  const mockFile = new File(
                    ["[File content not available in demo]"],
                    field.fileName,
                    { type: field.fileType || "application/octet-stream" }
                  );
                  formData!.append(field.key, mockFile);
                }
              } else {
                const processedValue = this.replaceVariables(
                  field.value || "",
                  mergedVariables
                );
                formData!.append(field.key, processedValue);
              }
            }
          });
          delete headers["Content-Type"]; // Let browser set boundary
          body = "";
        }
      } catch (error) {
        console.warn("Error parsing form data:", error);
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        try {
          const parsed = JSON.parse(body) as unknown;
          if (Array.isArray(parsed)) {
            type TextField = {
              enabled?: boolean;
              key?: string;
              type?: string;
              value?: string;
            };
            const urlEncodedData = (parsed as TextField[])
              .filter(
                (field) => field.enabled && field.key && field.type === "text"
              )
              .map((field) => {
                const processedValue = this.replaceVariables(
                  field.value || "",
                  mergedVariables
                );
                return `${encodeURIComponent(field.key!)}=${encodeURIComponent(
                  processedValue
                )}`;
              })
              .join("&");
            body = urlEncodedData;
          }
        } catch {
          // Keep original body
        }
      }
    } else if (request.bodyType === "json" && body) {
      headers["Content-Type"] = "application/json";
    }

    return { body, formData, headers };
  }

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
      const mergedVariables = this.mergeEnvironmentVariables(environments);
      const scriptContext = this.buildScriptContext(
        request,
        environments,
        mergedVariables,
        onEnvironmentUpdate
      );

      // Execute pre-request script if present
      if (request.preScript?.trim()) {
        try {
          await this.executeScript(request.preScript, scriptContext);
        } catch (error) {
          console.warn("Pre-request script error:", error);
        }
      }

      // Build URL, headers and body
      let url = this.replacePathVariables(request.url, request.pathVariables);
      url = this.replaceVariables(url, mergedVariables);
      const headers = this.buildHeadersWithVariables(
        request.headers,
        mergedVariables
      );
      const { body, formData } = this.buildBodyAndHeaders(
        request,
        mergedVariables,
        headers
      );

      // Prepare axios config
      const config: AxiosRequestConfig = {
        method: request.method.toLowerCase(),
        url,
        headers,
      };

      // Add body if not GET/HEAD
      if (request.method !== "GET" && request.method !== "HEAD") {
        if (formData) {
          config.data = formData;
        } else if (body) {
          if (request.bodyType === "json") {
            try {
              JSON.parse(body); // Validate JSON
              config.data = body;
            } catch {
              throw new Error("Invalid JSON body");
            }
          } else {
            config.data = body;
          }
        }
      }

      // Execute request
      const response = await this.axiosInstance.request(config);
      const endTime = Date.now();

      // Get response data
      const data = await this.parseResponseBody(response);

      // Prepare response headers
      const responseHeaders: Record<string, string> = {};
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          responseHeaders[key] = value;
        }
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
    } catch (error: unknown) {
      const endTime = Date.now();
      console.error("Request execution error:", error);
      const err = error as Error & {
        status?: number;
        message?: string;
        headers?: Headers | Record<string, string>;
      };
      throw {
        status: typeof err.status === "number" ? err.status : 0,
        statusText: typeof err.message === "string" ? err.message : "Network Error",
        headers: err.headers || {},
        data: err instanceof Error ? err.message : "Unknown error",
        time: endTime - startTime,
        size: 0,
        testResults: [],
      };
    }
  }

  private calculateSize(data: unknown): number {
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

  async executeScript(
    script: string,
    context: {
      environments?: Environment[];
      variables?: Record<string, string>;
      request?: HttpRequest;
      response?: RequestResponse;
      updateEnvironmentVariable?: (
        key: string,
        value: string,
        environmentName?: string
      ) => void;
    } = {}
  ): Promise<unknown> {
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
        expect: (actual: unknown) => ({
          to: {
            equal: (expected: unknown) => {
              if (actual !== expected) {
                throw new Error(`Expected ${expected} but got ${actual}`);
              }
            },
            have: {
              status: (expected: number) => {
                const resp = context.response;
                if (resp?.status !== expected) {
                  throw new Error(
                    `Expected status ${expected} but got ${resp?.status}`
                  );
                }
              },
            },
          },
        }),
        response: (() => {
          const resp = context.response;
          if (!resp) return undefined;
          return {
            status: resp.status,
            headers: resp.headers,
            data: resp.data,
            json: () => resp.data,
            text: () => (typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data)),
          };
        })(),
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
    context: {
      environments?: Environment[];
      variables?: Record<string, string>;
      request?: HttpRequest;
      response?: RequestResponse;
      updateEnvironmentVariable?: (
        key: string,
        value: string,
        environmentName?: string
      ) => void;
    } = {}
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
        expect: (actual: unknown) => ({
          to: {
            equal: (expected: unknown) => {
              if (actual !== expected) {
                throw new Error(`Expected ${expected} but got ${actual}`);
              }
            },
            have: {
              status: (expected: number) => {
                const resp = context.response;
                if (resp?.status !== expected) {
                  throw new Error(
                    `Expected status ${expected} but got ${resp?.status}`
                  );
                }
              },
              property: (prop: string) => {
                const resp = context.response;
                if (!resp || typeof resp.data !== "object" || resp.data === null || !(prop in (resp.data as Record<string, unknown>))) {
                  throw new Error(
                    `Expected response to have property '${prop}'`
                  );
                }
                return {
                  that: {
                    equals: (expected: unknown) => {
                      const dataObj = resp.data as Record<string, unknown>;
                      if (dataObj[prop] !== expected) {
                        throw new Error(
                          `Expected property '${prop}' to equal ${expected} but got ${dataObj[prop]}`
                        );
                      }
                    },
                  },
                };
              },
            },
            be: {
              ok: () => {
                const resp = context.response;
                if (!resp || resp.status < 200 || resp.status >= 300) {
                  throw new Error(
                    `Expected response to be ok but got status ${resp?.status}`
                  );
                }
              },
            },
          },
        }),
        response: (() => {
          const resp = context.response;
          return {
            status: resp?.status,
            headers: resp?.headers,
            data: resp?.data,
            json: () => resp?.data,
            text: () => (typeof resp?.data === "string" ? (resp?.data as string) : JSON.stringify(resp?.data)),
            to: {
              have: {
                status: (expected: number) => {
                  if (resp?.status !== expected) {
                    throw new Error(
                      `Expected status ${expected} but got ${resp?.status}`
                    );
                  }
                },
                jsonBody: () => {
                  const contentType = (resp?.headers as Record<string, string> | undefined)?.["content-type"] || "";
                  if (!contentType.includes("application/json")) {
                    throw new Error("Expected response to have JSON body");
                  }
                },
              },
            },
          };
        })(),
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
