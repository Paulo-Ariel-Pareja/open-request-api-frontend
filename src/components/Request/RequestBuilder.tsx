/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useMemo } from "react";
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

import { 
  KeyValuePair, 
  PathVariable, 
  parseUrlParams, 
  parseHeaders, 
  extractPathVariables, 
  replaceVariables, 
  buildUrlWithParams, 
  buildHeadersFromPairs 
} from "./RequestBuilderUtils";
import { useKeyValuePairs } from "./useKeyValuePairs";

interface FormField {
  key: string;
  value: string;
  type: string;
  enabled: boolean;
  fileName?: string;
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

  // Use custom hooks for managing key-value pairs
  const { pairs: params, setPairs: setParams, updatePair: updateParam, addPair: addParam, removePair: removeParam } = 
    useKeyValuePairs([]);
  const { pairs: headers, setPairs: setHeaders, updatePair: updateHeader, addPair: addHeader, removePair: removeHeader } = 
    useKeyValuePairs([]);
  const [pathVariables, setPathVariables] = useState<PathVariable[]>([]);

  // Memoized values
  const mergedEnvironmentVariables = useMemo(() => {
    const merged: Record<string, string> = {};
    activeEnvironments.forEach((env) => {
      Object.assign(merged, env.variables);
    });
    return merged;
  }, [activeEnvironments]);

  const methods = useMemo(() => ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"], []);
  const bodyTypes = useMemo(() => ["none", "json", "form", "raw"], []);

  // Tab configuration
  const tabs = useMemo(() => [
    { id: "params", label: "Params" },
    { id: "pathvars", label: "Path Variables" },
    { id: "headers", label: "Headers" },
    { id: "body", label: "Body" },
    { id: "scripts", label: "Scripts" },
    { id: "tests", label: "Tests" },
    { id: "curl", label: "cURL" },
  ], []);

  const responseTabs = useMemo(() => [
    { id: "body", label: "Body" },
    { id: "headers", label: "Headers" },
    { id: "tests", label: "Test Results" },
  ], []);

  useEffect(() => {
    if (activeRequest) {
      const requestCopy = JSON.parse(JSON.stringify(activeRequest));
      setRequest(requestCopy);
      setResponse(null);

      // Extract collection ID
      const collectionIdMatch = activeRequest._id.match(/^(.+)_req_/);
      setCollectionId(collectionIdMatch ? collectionIdMatch[1] : null);

      // Parse URL parameters, headers, and path variables
      setParams(parseUrlParams(activeRequest.url || ""));
      setHeaders(parseHeaders(activeRequest.headers));
      
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
  }, [activeRequest, setParams, setHeaders]);

  const handleSave = useCallback(async () => {
    if (!request) return;
    
    try {
      const pathVarsObject: Record<string, string> = {};
      pathVariables.forEach((pathVar) => {
        pathVarsObject[pathVar.key] = pathVar.value;
      });

      const updatedRequest = {
        ...request,
        pathVariables: pathVarsObject,
        updatedAt: new Date().toISOString(),
      };

      const { collectionId, _id, createdAt, updatedAt, ...data } = updatedRequest;
      await updateRequest(collectionId, request._id, data);

      setRequest(updatedRequest);
      setActiveRequest(updatedRequest);
    } catch (error) {
      console.error("Error saving request:", error);
    }
  }, [request, pathVariables, updateRequest, setActiveRequest]);

  const buildFinalRequest = useCallback((): HttpRequest => {
    if (!request) return request!;

    let finalUrl = request.url;

    // Replace path variables
    pathVariables.forEach((pathVar) => {
      if (pathVar.value) {
        finalUrl = finalUrl.replace(`:${pathVar.key}`, pathVar.value);
      }
    });

    // Build URL with parameters
    finalUrl = buildUrlWithParams(finalUrl, params);

    // Build headers
    const finalHeaders = buildHeadersFromPairs(headers);

    return {
      ...request,
      url: finalUrl,
      headers: finalHeaders,
    };
  }, [request, pathVariables, params, headers]);

  const handleSend = useCallback(async () => {
    if (!request) return;

    setLoading(true);
    try {
      const finalRequest = buildFinalRequest();
      
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
      setResponseTab("body");
    } catch (error) {
      setResponse(error as RequestResponse);
      setResponseTab("body");
    } finally {
      setLoading(false);
    }
  }, [request, buildFinalRequest, activeEnvironments, updateEnvironmentVariable]);

  const generateCurlCommand = useCallback((): string => {
    if (!request) return "";

    const finalRequest = buildFinalRequest();
    let finalUrl = replaceVariables(finalRequest.url, mergedEnvironmentVariables);

    // Replace path variables
    pathVariables.forEach((pathVar) => {
      if (pathVar.value) {
        const replacedValue = replaceVariables(pathVar.value, mergedEnvironmentVariables);
        finalUrl = finalUrl.replace(`:${pathVar.key}`, replacedValue);
      }
    });

    let curlCommand = `curl -X ${finalRequest.method}`;
    curlCommand += ` '${finalUrl}'`;

    // Add headers
    Object.entries(finalRequest.headers).forEach(([key, value]) => {
      const replacedValue = replaceVariables(value, mergedEnvironmentVariables);
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
              (field: FormField) => field.enabled && field.key
            );

            enabledFields.forEach((field: FormField) => {
              if (field.type === "file") {
                curlCommand += ` \\\n  -F '${field.key}=@${
                  field.fileName || "file.txt"
                }'`;
              } else {
                const replacedValue = replaceVariables(
                  field.value || "",
                  mergedEnvironmentVariables
                );
                curlCommand += ` \\\n  -F '${field.key}=${replacedValue}'`;
              }
            });
          }
        } catch {
          const replacedBody = replaceVariables(
            finalRequest.body,
            mergedEnvironmentVariables
          );
          curlCommand += ` \\\n  -d '${replacedBody}'`;
        }
      } else {
        const replacedBody = replaceVariables(
          finalRequest.body,
          mergedEnvironmentVariables
        );
        curlCommand += ` \\\n  -d '${replacedBody}'`;
      }
    }

    return curlCommand;
  }, [request, buildFinalRequest, pathVariables, mergedEnvironmentVariables]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, []);

  const updateRequestData = useCallback((updates: Partial<HttpRequest>) => {
    if (request) {
      const updatedRequest = { ...request, ...updates };
      setRequest(updatedRequest);

      // Update path variables when URL changes
      if (updates.url !== undefined) {
        const newPathVars = extractPathVariables(updates.url);
        setPathVariables((prevPathVars) => {
          return newPathVars.map((newVar) => {
            const existing = prevPathVars.find((pv) => pv.key === newVar.key);
            return existing || newVar;
          });
        });

        // Parse and update query parameters when URL changes
        const newParams = parseUrlParams(updates.url);
        setParams(newParams);
      }
    }
  }, [request, setParams]);

  const updateParamsOnUrl = useCallback((newParams: KeyValuePair[]) => {
    if (request) {
      setParams(newParams);
      const enabledParams = newParams.filter((p) => p.enabled && p.key.trim());

      let baseURL = request.url;
      if (request.url.includes("?")) {
        baseURL = request.url.split("?")[0];
      }
      
      if (enabledParams.length > 0) {
        const paramString = enabledParams
          .map(
            (p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
          )
          .join("&");
        updateRequestData({ url: `${baseURL}?${paramString}` });
      } else {
        updateRequestData({ url: baseURL });
      }
    }
  }, [request, setParams, updateRequestData]);

  const updateParamWithUrl = useCallback((
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => {
    updateParam(index, field, value);
    // Update URL after param change
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: value };
    updateParamsOnUrl(newParams);
  }, [updateParam, params, updateParamsOnUrl]);

  const updateHeaderWithRequest = useCallback((
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => {
    updateHeader(index, field, value);
    
    // Update request headers
    if (request) {
      const newHeaders = [...headers];
      newHeaders[index] = { ...newHeaders[index], [field]: value };
      const finalHeaders = buildHeadersFromPairs(newHeaders);
      updateRequestData({ headers: finalHeaders });
    }
  }, [updateHeader, headers, request, updateRequestData]);

  const updatePathVariable = useCallback((index: number, value: string) => {
    setPathVariables(prev => {
      const newPathVars = [...prev];
      newPathVars[index] = { ...newPathVars[index], value };
      return newPathVars;
    });
  }, []);

  const duplicateRequest = useCallback(async () => {
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
  }, [request, saveRequest, setActiveRequest]);

  // Early return for no request
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

  // Render functions for tabs
  const renderParamsTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Query Parameters</h4>
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
              onChange={(e) => updateParamWithUrl(index, "enabled", e.target.checked)}
              className="w-4 h-4 text-cyan-400 bg-gray-800 border-gray-600 rounded focus:ring-cyan-400"
            />
            <input
              type="text"
              value={param.key}
              onChange={(e) => updateParamWithUrl(index, "key", e.target.value)}
              placeholder="Parameter name"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
            />
            <input
              type="text"
              value={param.value}
              onChange={(e) => updateParamWithUrl(index, "value", e.target.value)}
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
  );

  const renderPathVarsTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Path Variables</h4>
        <span className="text-xs text-gray-500">
          Use :variable in URL to create path variables
        </span>
      </div>
      {pathVariables.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No path variables found</p>
          <p className="text-gray-600 text-xs mt-1">
            Add :variable to your URL to create path variables
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Example: https://api.example.com/users/:userId/posts/:postId
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
                onChange={(e) => updatePathVariable(index, e.target.value)}
                placeholder={`Value for ${pathVar.key} (use {{variable}} for environment variables)`}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHeadersTab = () => (
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
              onChange={(e) => updateHeaderWithRequest(index, "enabled", e.target.checked)}
              className="w-4 h-4 text-cyan-400 bg-gray-800 border-gray-600 rounded focus:ring-cyan-400"
            />
            <input
              type="text"
              value={header.key}
              onChange={(e) => updateHeaderWithRequest(index, "key", e.target.value)}
              placeholder="Header name"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
            />
            <input
              type="text"
              value={header.value}
              onChange={(e) => updateHeaderWithRequest(index, "value", e.target.value)}
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
  );

  const renderBodyTab = () => (
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
                  bodyType: e.target.value as HttpRequest['bodyType'],
                  body: e.target.value === "none" ? "" : request.body,
                })
              }
              className="text-cyan-400"
            />
            <span className="text-sm text-gray-300 capitalize">{type}</span>
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
            onChange={(e) => updateRequestData({ body: e.target.value })}
            placeholder={`Enter ${request.bodyType} data... (use {{variable}} for environment variables)`}
            className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm resize-none"
          />
        </div>
      )}
    </div>
  );

  const renderScriptsTab = () => (
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
          onChange={(e) => updateRequestData({ preScript: e.target.value })}
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
          onChange={(e) => updateRequestData({ postScript: e.target.value })}
          placeholder="// Execute JavaScript after receiving response
// Example:
// const responseData = pm.response.json();
// pm.environment.set('token', responseData.token);
// pm.environment.set('userId', responseData.user.id);"
          className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm resize-none"
        />
      </div>
    </div>
  );

  const renderTestsTab = () => (
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
  );

  const renderCurlTab = () => (
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
        <div className="font-medium mb-2">📋 cURL Command Preview</div>
        <ul className="space-y-1">
          <li>• All environment variables are replaced with their actual values</li>
          <li>• Path variables are substituted in the URL</li>
          <li>• Only enabled headers and parameters are included</li>
          <li>• Form data is converted to appropriate cURL format</li>
          <li>• Ready to copy and paste into terminal</li>
        </ul>
      </div>

      <div className="relative">
        <pre className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
          {generateCurlCommand() || "// Configure your request to see the cURL command"}
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
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "params": return renderParamsTab();
      case "pathvars": return renderPathVarsTab();
      case "headers": return renderHeadersTab();
      case "body": return renderBodyTab();
      case "scripts": return renderScriptsTab();
      case "tests": return renderTestsTab();
      case "curl": return renderCurlTab();
      default: return null;
    }
  };

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
            onChange={(e) => updateRequestData({ method: e.target.value as HttpRequest['method'] })}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm font-mono"
          >
            {methods.map((method) => (
              <option key={method} value={method}>{method}</option>
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
              {tabs.map((tab) => (
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
            {renderTabContent()}
          </div>
        </div>

        {/* Response Panel */}
        {response && (
          <div className="w-1/2 border-l border-gray-700 flex flex-col h-[calc(100vh-15rem)]">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-300">Response</h3>
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
                {responseTabs.map((tab) => (
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
                            {response.testResults.filter((t) => t.passed).length} passed
                          </span>
                          <span className="text-red-400">
                            {response.testResults.filter((t) => !t.passed).length} failed
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
                                <CheckCircle size={16} className="text-green-400" />
                              ) : (
                                <XCircle size={16} className="text-red-400" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  test.passed ? "text-green-400" : "text-red-400"
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
                      <TestTube size={32} className="text-gray-600 mx-auto mb-2" />
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
