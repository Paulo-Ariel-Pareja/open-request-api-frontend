/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import {
  Send,
  Save,
  Copy,
  Trash2,
  Code,
  TestTube,
  Plus,
  CheckCircle,
  XCircle,
  Terminal,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { requestService } from "../../services/request";
import { HttpRequest, RequestResponse } from "../../types";
import { FormDataEditor } from "./FormDataEditor";

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

interface PathVariable {
  key: string;
  value: string;
}

export function RequestBuilder() {
  const {
    activeRequest,
    setActiveRequest,
    activeEnvironments,
    updateRequest,
    saveRequest,
    updateEnvironmentVariable,
  } = useApp();

  const [request, setRequest] = useState<HttpRequest | null>(null);
  const [response, setResponse] = useState<RequestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("params");
  const [responseTab, setResponseTab] = useState("body");
  const [collectionId, setCollectionId] = useState<string | null>(null);

  // Local state for params, headers, and path variables
  const [params, setParams] = useState<KeyValuePair[]>([]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([]);
  const [pathVariables, setPathVariables] = useState<PathVariable[]>([]);

  useEffect(() => {
    if (activeRequest) {
      // Create a deep copy to avoid mutations
      const requestCopy = JSON.parse(JSON.stringify(activeRequest));
      setRequest(requestCopy);
      setResponse(null);

      // Extract collection ID from request ID pattern (assuming format: collectionId_req_*)
      const collectionIdMatch = activeRequest._id.match(/^(.+)_req_/);
      if (collectionIdMatch) {
        setCollectionId(collectionIdMatch[1]);
      }

      // Parse URL parameters
      try {
        const url = new URL(activeRequest.url || "http://example.com");
        const urlParams: KeyValuePair[] = [];
        url.searchParams.forEach((value, key) => {
          urlParams.push({ key, value, enabled: true });
        });
        if (urlParams.length === 0) {
          urlParams.push({ key: "", value: "", enabled: true });
        }
        setParams(urlParams);
      } catch {
        setParams([{ key: "", value: "", enabled: true }]);
      }

      // Parse headers
      const headerPairs: KeyValuePair[] = Object.entries(
        activeRequest.headers || {}
      ).map(([key, value]) => ({
        key,
        value,
        enabled: true,
      }));
      if (headerPairs.length === 0) {
        headerPairs.push({ key: "", value: "", enabled: true });
      }
      setHeaders(headerPairs);

      // Parse path variables from stored data or URL
      const storedPathVars = activeRequest.pathVariables || {};
      const pathVars = extractPathVariables(activeRequest.url || "");
      const mergedPathVars = pathVars.map((pathVar) => ({
        key: pathVar.key,
        value: storedPathVars[pathVar.key] || pathVar.value,
      }));
      setPathVariables(mergedPathVars);
    } else {
      setRequest(null);
      setResponse(null);
      setParams([{ key: "", value: "", enabled: true }]);
      setHeaders([{ key: "", value: "", enabled: true }]);
      setPathVariables([]);
      setCollectionId(null);
    }
  }, [activeRequest]);

  const extractPathVariables = (url: string): PathVariable[] => {
    const matches = url.match(/:(\w+)/g);
    if (!matches) return [];

    return matches.map((match) => ({
      key: match.substring(1), // Remove the ':'
      value: "",
    }));
  };

  const handleSave = async () => {
    if (request) {
      try {
        // Save path variables to request
        const pathVarsObject: Record<string, string> = {};
        pathVariables.forEach((pathVar) => {
          pathVarsObject[pathVar.key] = pathVar.value;
        });

        const updatedRequest = {
          ...request,
          pathVariables: pathVarsObject,
          updatedAt: new Date().toISOString(),
        };

        const { collectionId, _id, createdAt, updatedAt, ...data } =
          updatedRequest;
        // Update request via API
        await updateRequest(collectionId, request._id, data);

        // Update local state
        setRequest(updatedRequest);
        setActiveRequest(updatedRequest);
      } catch (error) {
        console.error("Error saving request:", error);
      }
    }
  };

  const handleSend = async () => {
    if (!request) return;

    setLoading(true);
    try {
      // Build final request with current params, headers, and path variables
      const finalRequest = buildFinalRequest();

      // Create callback to update environment variables
      const onEnvironmentUpdate = (
        environmentId: string,
        key: string,
        value: string
      ) => {
        updateEnvironmentVariable(environmentId, key, value);
      };

      const result = await requestService.executeRequest(
        finalRequest,
        activeEnvironments,
        onEnvironmentUpdate
      );
      setResponse(result);
      setResponseTab("body"); // Switch to body tab to show response
    } catch (error) {
      setResponse(error as RequestResponse);
      setResponseTab("body");
    } finally {
      setLoading(false);
    }
  };

  const buildFinalRequest = (): HttpRequest => {
    if (!request) return request!;

    let finalUrl = request.url;

    // Replace path variables
    pathVariables.forEach((pathVar) => {
      if (pathVar.value) {
        finalUrl = finalUrl.replace(`:${pathVar.key}`, pathVar.value);
      }
    });

    // Build URL with parameters (only enabled ones)
    const enabledParams = params.filter((p) => p.enabled && p.key.trim());

    if (enabledParams.length > 0) {
      try {
        const url = new URL(finalUrl || "http://example.com");
        url.search = ""; // Clear existing params
        enabledParams.forEach((param) => {
          if (param.key.trim()) {
            url.searchParams.set(param.key, param.value);
          }
        });
        finalUrl = url.toString();
      } catch {
        // If URL is invalid, append params manually
        const paramString = enabledParams
          .map(
            (p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
          )
          .join("&");
        finalUrl =
          finalUrl + (finalUrl.includes("?") ? "&" : "?") + paramString;
      }
    }

    // Build headers (only enabled ones)
    const finalHeaders: Record<string, string> = {};
    headers
      .filter((h) => h.enabled && h.key.trim())
      .forEach((header) => {
        finalHeaders[header.key] = header.value;
      });

    return {
      ...request,
      url: finalUrl,
      headers: finalHeaders,
    };
  };

  const replaceVariables = (
    text: string,
    variables: Record<string, string>
  ): string => {
    return text.replace(/\{\{([\w-]+)\}\}/g, (match, varName) => {
      const value = variables[varName];
      if (value !== undefined) {
        return value;
      }
      return match;
    });
  };

  const generateCurlCommand = (): string => {
    if (!request) return "";

    // Merge all active environment variables
    const mergedVariables: Record<string, string> = {};
    activeEnvironments.forEach((env) => {
      Object.assign(mergedVariables, env.variables);
    });

    // Build final request with all replacements
    const finalRequest = buildFinalRequest();

    // Replace environment variables in URL
    let finalUrl = replaceVariables(finalRequest.url, mergedVariables);

    // Replace path variables
    pathVariables.forEach((pathVar) => {
      if (pathVar.value) {
        const replacedValue = replaceVariables(pathVar.value, mergedVariables);
        finalUrl = finalUrl.replace(`:${pathVar.key}`, replacedValue);
      }
    });

    let curlCommand = `curl -X ${finalRequest.method}`;

    // Add URL (quoted to handle special characters)
    curlCommand += ` '${finalUrl}'`;

    // Add headers
    Object.entries(finalRequest.headers).forEach(([key, value]) => {
      const replacedValue = replaceVariables(value, mergedVariables);
      curlCommand += ` \\\n  -H '${key}: ${replacedValue}'`;
    });

    // Add body if present and method supports it
    if (
      finalRequest.method !== "GET" &&
      finalRequest.method !== "HEAD" &&
      finalRequest.body
    ) {
      if (finalRequest.bodyType === "form") {
        try {
          const formFields = JSON.parse(finalRequest.body);
          if (Array.isArray(formFields)) {
            const enabledFields = formFields.filter(
              (field: any) => field.enabled && field.key
            );

            if (enabledFields.length > 0) {
              enabledFields.forEach((field: any) => {
                if (field.type === "file") {
                  curlCommand += ` \\\n  -F '${field.key}=@${
                    field.fileName || "file.txt"
                  }'`;
                } else {
                  const replacedValue = replaceVariables(
                    field.value || "",
                    mergedVariables
                  );
                  curlCommand += ` \\\n  -F '${field.key}=${replacedValue}'`;
                }
              });
            }
          }
        } catch {
          // Fallback to URL encoded
          const replacedBody = replaceVariables(
            finalRequest.body,
            mergedVariables
          );
          curlCommand += ` \\\n  -d '${replacedBody}'`;
        }
      } else {
        const replacedBody = replaceVariables(
          finalRequest.body,
          mergedVariables
        );
        curlCommand += ` \\\n  -d '${replacedBody}'`;
      }
    }

    return curlCommand;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const updateRequestData = (updates: Partial<HttpRequest>) => {
    if (request) {
      const updatedRequest = { ...request, ...updates };
      setRequest(updatedRequest);

      // Update path variables when URL changes
      if (updates.url !== undefined) {
        const newPathVars = extractPathVariables(updates.url);
        setPathVariables((prevPathVars) => {
          // Preserve existing values for matching keys
          return newPathVars.map((newVar) => {
            const existing = prevPathVars.find((pv) => pv.key === newVar.key);
            return existing || newVar;
          });
        });

        // Parse URL parameters when URL changes
        try {
          const url = new URL(updates.url || "http://example.com");
          const urlParams: KeyValuePair[] = [];
          url.searchParams.forEach((value, key) => {
            urlParams.push({ key, value, enabled: true });
          });
          if (urlParams.length === 0) {
            urlParams.push({ key: "", value: "", enabled: true });
          }
          setParams(urlParams);
        } catch {
          // Invalid URL, keep current params
        }
      }
    }
  };

  const updateParam = (
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: value };
    setParams(newParams);

    // Update the request URL with enabled params only
    if (request) {
      const enabledParams = newParams.filter((p) => p.enabled && p.key.trim());
      let baseUrl = request.url;

      try {
        const url = new URL(baseUrl || "http://example.com");
        const baseWithoutParams = `${url.protocol}//${url.host}${url.pathname}`;

        if (enabledParams.length > 0) {
          const paramString = enabledParams
            .map(
              (p) =>
                `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
            )
            .join("&");
          updateRequestData({ url: `${baseWithoutParams}?${paramString}` });
        } else {
          updateRequestData({ url: baseWithoutParams });
        }
      } catch {
        // Keep original URL if parsing fails
      }
    }
  };

  const addParam = () => {
    setParams([...params, { key: "", value: "", enabled: true }]);
  };

  const removeParam = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    if (newParams.length === 0) {
      newParams.push({ key: "", value: "", enabled: true });
    }
    setParams(newParams);
  };

  const updateHeader = (
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);

    // Update request headers with enabled headers only
    if (request) {
      const finalHeaders: Record<string, string> = {};
      newHeaders
        .filter((h) => h.enabled && h.key.trim())
        .forEach((header) => {
          finalHeaders[header.key] = header.value;
        });
      updateRequestData({ headers: finalHeaders });
    }
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "", enabled: true }]);
  };

  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    if (newHeaders.length === 0) {
      newHeaders.push({ key: "", value: "", enabled: true });
    }
    setHeaders(newHeaders);
  };

  const updatePathVariable = (index: number, value: string) => {
    const newPathVars = [...pathVariables];
    newPathVars[index] = { ...newPathVars[index], value };
    setPathVariables(newPathVars);
  };

  const duplicateRequest = async () => {
    if (request) {
      try {
        const { collectionId, _id, createdAt, updatedAt, ...data } = request;
        const duplicatedRequest = await saveRequest(collectionId, {
          ...data,
          name: `${data.name} (Copy)`,
        });

        setActiveRequest(duplicatedRequest);
      } catch (error) {
        console.error("Error duplicating request:", error);
      }
    }
  };

  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
  const bodyTypes = ["none", "json", "form", "raw"];

  if (!request) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Send size={24} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            No Request Selected
          </h3>
          <p className="text-gray-500">
            Select a request from the sidebar or create a new one to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Request Header */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="text"
            value={request.name}
            onChange={(e) => updateRequestData({ name: e.target.value })}
            className="text-xl font-semibold bg-transparent text-white border-none outline-none"
            placeholder="Request Name"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 flex items-center space-x-2 text-sm"
            >
              <Save size={14} />
              <span>Save</span>
            </button>
            <button
              onClick={duplicateRequest}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 flex items-center space-x-2 text-sm"
            >
              <Copy size={14} />
              <span>Duplicate</span>
            </button>
          </div>
        </div>

        {/* URL Bar */}
        <div className="flex space-x-2">
          <select
            value={request.method}
            onChange={(e) =>
              updateRequestData({ method: e.target.value as any })
            }
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm font-mono"
          >
            {methods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={request.url}
            onChange={(e) => updateRequestData({ url: e.target.value })}
            placeholder="Enter request URL (use :variable for path variables, {{variable}} for environment variables)"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
          />

          <button
            onClick={handleSend}
            disabled={loading || !request.url}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send size={16} />
            <span>{loading ? "Sending..." : "Send"}</span>
          </button>
        </div>
      </div>

      {/* Request Configuration */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="border-b border-gray-700">
            <div className="flex">
              {[
                { id: "params", label: "Params" },
                { id: "pathvars", label: "Path Variables" },
                { id: "headers", label: "Headers" },
                { id: "body", label: "Body" },
                { id: "scripts", label: "Scripts" },
                { id: "tests", label: "Tests" },
                { id: "curl", label: "cURL" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
                    activeTab === tab.id
                      ? "text-cyan-400 border-cyan-400"
                      : "text-gray-400 border-transparent hover:text-gray-300"
                  }`}
                >
                  {tab.id === "curl" && <Terminal size={16} className="mr-1" />}
                  {tab.label}
                  {tab.id === "pathvars" && pathVariables.length > 0 && (
                    <span className="ml-1 px-1 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
                      {pathVariables.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === "params" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-300">
                    Query Parameters
                  </h4>
                  <button
                    onClick={addParam}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <Plus size={14} />
                    <span>Add Parameter</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {params.map((param, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={param.enabled}
                        onChange={(e) =>
                          updateParam(index, "enabled", e.target.checked)
                        }
                        className="w-4 h-4 text-cyan-400 bg-gray-800 border-gray-600 rounded focus:ring-cyan-400"
                      />
                      <input
                        type="text"
                        value={param.key}
                        onChange={(e) =>
                          updateParam(index, "key", e.target.value)
                        }
                        placeholder="Parameter name"
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
                      />
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) =>
                          updateParam(index, "value", e.target.value)
                        }
                        placeholder="Parameter value (use {{variable}} for environment variables)"
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
                      />
                      <button
                        onClick={() => removeParam(index)}
                        className="p-2 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "pathvars" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-300">
                    Path Variables
                  </h4>
                  <span className="text-xs text-gray-500">
                    Use :variable in URL to create path variables
                  </span>
                </div>

                {pathVariables.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      No path variables found
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Add :variable to your URL to create path variables
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Example:
                      https://api.example.com/users/:userId/posts/:postId
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pathVariables.map((pathVar, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="w-24 text-sm text-cyan-400 font-mono">
                          :{pathVar.key}
                        </span>
                        <input
                          type="text"
                          value={pathVar.value}
                          onChange={(e) =>
                            updatePathVariable(index, e.target.value)
                          }
                          placeholder={`Value for ${pathVar.key} (use {{variable}} for environment variables)`}
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "headers" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-300">Headers</h4>
                  <button
                    onClick={addHeader}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <Plus size={14} />
                    <span>Add Header</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={(e) =>
                          updateHeader(index, "enabled", e.target.checked)
                        }
                        className="w-4 h-4 text-cyan-400 bg-gray-800 border-gray-600 rounded focus:ring-cyan-400"
                      />
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) =>
                          updateHeader(index, "key", e.target.value)
                        }
                        placeholder="Header name"
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) =>
                          updateHeader(index, "value", e.target.value)
                        }
                        placeholder="Header value (use {{variable}} for environment variables)"
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
                      />
                      <button
                        onClick={() => removeHeader(index)}
                        className="p-2 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "body" && (
              <div className="space-y-4">
                <div className="flex space-x-4">
                  {bodyTypes.map((type) => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="bodyType"
                        value={type}
                        checked={request.bodyType === type}
                        onChange={(e) =>
                          updateRequestData({
                            bodyType: e.target.value as any,
                            // Clear body when switching types to avoid confusion
                            body: e.target.value === "none" ? "" : request.body,
                          })
                        }
                        className="text-cyan-400"
                      />
                      <span className="text-sm text-gray-300 capitalize">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>

                {request.bodyType === "form" && (
                  <FormDataEditor
                    value={request.body}
                    onChange={(value) => updateRequestData({ body: value })}
                  />
                )}

                {request.bodyType !== "none" && request.bodyType !== "form" && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
                      💡 <strong>Tip:</strong> Use <code>{"{{variable}}"}</code>{" "}
                      to reference environment variables in your body
                    </div>
                    <textarea
                      value={request.body}
                      onChange={(e) =>
                        updateRequestData({ body: e.target.value })
                      }
                      placeholder={`Enter ${request.bodyType} data... (use {{variable}} for environment variables)`}
                      className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm resize-none"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "scripts" && (
              <div className="space-y-4">
                <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded mb-2">
                  💡 <strong>Tip:</strong> Scripts running in requests can
                  generate environment variables, but they are only temporary,
                  they are not saved in the database.
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                    <Code size={16} />
                    <span>Pre-request Script</span>
                  </h4>
                  <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded mb-2">
                    💡 <strong>Tip:</strong> Use{" "}
                    <code>pm.environment.set('key', 'value')</code> to update
                    environment variables
                  </div>
                  <textarea
                    value={request.preScript}
                    onChange={(e) =>
                      updateRequestData({ preScript: e.target.value })
                    }
                    placeholder="// Execute JavaScript before sending request
// Example:
// pm.environment.set('timestamp', Date.now());
// pm.environment.set('token', 'Bearer ' + pm.environment.get('apiKey'));"
                    className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm resize-none"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                    <Code size={16} />
                    <span>Post-response Script</span>
                  </h4>
                  <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded mb-2">
                    💡 <strong>Tip:</strong> Use <code>pm.response.json()</code>{" "}
                    to access response data and{" "}
                    <code>pm.environment.set()</code> to save values
                  </div>
                  <textarea
                    value={request.postScript}
                    onChange={(e) =>
                      updateRequestData({ postScript: e.target.value })
                    }
                    placeholder="// Execute JavaScript after receiving response
// Example:
// const responseData = pm.response.json();
// pm.environment.set('token', responseData.token);
// pm.environment.set('userId', responseData.user.id);"
                    className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm resize-none"
                  />
                </div>
              </div>
            )}

            {activeTab === "tests" && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                  <TestTube size={16} />
                  <span>Tests</span>
                </h4>
                <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded mb-2">
                  💡 <strong>Tip:</strong> Use <code>pm.test()</code> to create
                  tests and <code>pm.expect()</code> for assertions
                </div>
                <textarea
                  value={request.tests}
                  onChange={(e) => updateRequestData({ tests: e.target.value })}
                  placeholder="pm.test('Status code is 200', function () {
    pm.expect(pm.response.status).to.equal(200);
});

pm.test('Response has required fields', function () {
    const responseData = pm.response.json();
    pm.expect(responseData).to.have.property('id');
    pm.expect(responseData).to.have.property('name');
});

pm.test('Response is ok', function () {
    pm.expect(pm.response).to.be.ok;
});"
                  className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm resize-none"
                />
              </div>
            )}

            {activeTab === "curl" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                    <Terminal size={16} />
                    <span>cURL Command</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard(generateCurlCommand())}
                    className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 flex items-center space-x-2 text-sm"
                  >
                    <Copy size={14} />
                    <span>Copy</span>
                  </button>
                </div>

                <div className="text-xs text-gray-400 bg-gray-800 p-3 rounded-lg">
                  <div className="font-medium mb-2">
                    📋 cURL Command Preview
                  </div>
                  <ul className="space-y-1">
                    <li>
                      • All environment variables are replaced with their actual
                      values
                    </li>
                    <li>• Path variables are substituted in the URL</li>
                    <li>• Only enabled headers and parameters are included</li>
                    <li>• Form data is converted to appropriate cURL format</li>
                    <li>• Ready to copy and paste into terminal</li>
                  </ul>
                </div>

                <div className="relative">
                  <pre className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {generateCurlCommand() ||
                      "// Configure your request to see the cURL command"}
                  </pre>

                  {generateCurlCommand() && (
                    <button
                      onClick={() => copyToClipboard(generateCurlCommand())}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-400 hover:text-gray-300 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Response Panel */}
        {response && (
          <div className="w-1/2 border-l border-gray-700 flex flex-col h-[calc(100vh-15rem)]">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-300">
                  Response
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <span
                    className={`font-mono ${
                      response.status >= 200 && response.status < 300
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-gray-400">{response.time}ms</span>
                  <span className="text-gray-400">{response.size} bytes</span>
                </div>
              </div>
            </div>

            {/* Response Tabs */}
            <div className="border-b border-gray-700">
              <div className="flex">
                {[
                  { id: "body", label: "Body" },
                  { id: "headers", label: "Headers" },
                  { id: "tests", label: "Test Results" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setResponseTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center ${
                      responseTab === tab.id
                        ? "text-cyan-400 border-cyan-400"
                        : "text-gray-400 border-transparent hover:text-gray-300"
                    }`}
                  >
                    {tab.label}
                    {tab.id === "tests" &&
                      response.testResults &&
                      response.testResults.length > 0 && (
                        <span className="ml-1 px-1 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
                          {response.testResults.length}
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {responseTab === "body" && (
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                  {typeof response.data === "string"
                    ? response.data
                    : JSON.stringify(response.data, null, 2)}
                </pre>
              )}

              {responseTab === "headers" && (
                <div className="space-y-2">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start space-x-2 text-sm"
                    >
                      <span className="text-cyan-400 font-mono min-w-0 flex-shrink-0">
                        {key}:
                      </span>
                      <span className="text-gray-300 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {responseTab === "tests" && (
                <div className="space-y-3">
                  {response.testResults && response.testResults.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-300">
                          Test Results
                        </h4>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="text-green-400">
                            {
                              response.testResults.filter((t) => t.passed)
                                .length
                            }{" "}
                            passed
                          </span>
                          <span className="text-red-400">
                            {
                              response.testResults.filter((t) => !t.passed)
                                .length
                            }{" "}
                            failed
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {response.testResults.map((test, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${
                              test.passed
                                ? "bg-green-900/20 border-green-500/30"
                                : "bg-red-900/20 border-red-500/30"
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {test.passed ? (
                                <CheckCircle
                                  size={16}
                                  className="text-green-400"
                                />
                              ) : (
                                <XCircle size={16} className="text-red-400" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  test.passed
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {test.name}
                              </span>
                            </div>
                            {test.error && (
                              <div className="text-xs text-red-300 font-mono ml-6">
                                {test.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <TestTube
                        size={32}
                        className="text-gray-600 mx-auto mb-2"
                      />
                      <p className="text-gray-500 text-sm">No tests executed</p>
                      <p className="text-gray-600 text-xs mt-1">
                        Add tests in the Tests tab to see results here
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
