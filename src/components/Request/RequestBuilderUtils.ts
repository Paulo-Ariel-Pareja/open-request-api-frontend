// Utility functions for RequestBuilder
export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface PathVariable {
  key: string;
  value: string;
}

export const parseUrlParams = (url: string): KeyValuePair[] => {
  try {
    const urlObj = new URL(url || "http://example.com");
    const urlParams: KeyValuePair[] = [];
    urlObj.searchParams.forEach((value, key) => {
      urlParams.push({ key, value, enabled: true });
    });
    return urlParams.length > 0
      ? urlParams
      : [{ key: "", value: "", enabled: true }];
  } catch {
    const parts = url.split("?");
    if (parts.length > 1) {
      const rawQuerystring = parts[1];
      const querys = rawQuerystring.split("&");
      return querys.map((param) => {
        const [key, value] = param.split("=");
        return {
          key: decodeURIComponent(key),
          value: decodeURIComponent(value || ""),
          enabled: true,
        };
      });
    }
    return [{ key: "", value: "", enabled: true }];
  }
};

export const parseHeaders = (
  headers: Record<string, string> = {}
): KeyValuePair[] => {
  const headerPairs = Object.entries(headers).map(([key, value]) => ({
    key,
    value,
    enabled: true,
  }));
  return headerPairs.length > 0
    ? headerPairs
    : [{ key: "", value: "", enabled: true }];
};

export const extractPathVariables = (url: string): PathVariable[] => {
  const matches = url.match(/:(\w+)/g);
  if (!matches) return [];
  return matches.map((match) => ({
    key: match.substring(1),
    value: "",
  }));
};

export const replaceVariables = (
  text: string,
  variables: Record<string, string>
): string => {
  return text.replace(/\{\{([\w-]+)\}\}/g, (match, varName) => {
    return variables[varName] !== undefined ? variables[varName] : match;
  });
};

export const buildUrlWithParams = (
  baseUrl: string,
  params: KeyValuePair[]
): string => {
  const enabledParams = params.filter((p) => p.enabled && p.key.trim());

  if (enabledParams.length === 0) return baseUrl;

  try {
    const url = new URL(baseUrl || "http://example.com");
    url.search = "";
    enabledParams.forEach((param) => {
      if (param.key.trim()) {
        url.searchParams.set(param.key, param.value);
      }
    });
    return url.toString();
  } catch {
    const [urlBase, queryString] = baseUrl.split("?");
    const existingParams = new URLSearchParams(queryString || "");
    enabledParams.forEach((p) => {
      existingParams.delete(p.key);
    });
    const cleanedQuery = existingParams.toString();
    const paramString = enabledParams
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join("&");
    let finalUrl = urlBase;
    if (cleanedQuery || paramString) {
      finalUrl += "?" + [cleanedQuery, paramString].filter(Boolean).join("&");
    }
    return finalUrl;
  }
};

export const buildHeadersFromPairs = (
  headerPairs: KeyValuePair[]
): Record<string, string> => {
  const finalHeaders: Record<string, string> = {};
  headerPairs
    .filter((h) => h.enabled && h.key.trim())
    .forEach((header) => {
      finalHeaders[header.key] = header.value;
    });
  return finalHeaders;
};
