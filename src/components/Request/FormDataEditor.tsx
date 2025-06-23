import { useState, useEffect } from "react";
import { Plus, Trash2, Upload, File } from "lucide-react";

interface FormField {
  key: string;
  value: string;
  type: "text" | "file";
  enabled: boolean;
  file?: File;
}

interface FormDataEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function FormDataEditor({ value, onChange }: FormDataEditorProps) {
  const [fields, setFields] = useState<FormField[]>([]);

  // Parse form data from string value
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setFields(
            parsed.map((field) => ({
              ...field,
              type: field.type || "text",
              enabled: field.enabled !== false,
            }))
          );
          return;
        }
      } catch {
        // If not valid JSON, try to parse as URL encoded
        const urlParams = new URLSearchParams(value);
        const parsedFields: FormField[] = [];
        urlParams.forEach((fieldValue, key) => {
          parsedFields.push({
            key,
            value: fieldValue,
            type: "text",
            enabled: true,
          });
        });
        if (parsedFields.length > 0) {
          setFields(parsedFields);
          return;
        }
      }
    }

    // Default empty field
    if (fields.length === 0) {
      setFields([{ key: "", value: "", type: "text", enabled: true }]);
    }
  }, []);

  // Update parent component when fields change
  useEffect(() => {
    const formData = fields.filter(
      (field) => field.enabled && field.key.trim()
    );

    // For form data, we'll store as JSON but exclude the actual File objects
    // since they can't be serialized
    const serializedData = formData.map((field) => {
      if (field.file) {
        return {
          key: field.key,
          value: field.value,
          type: field.type,
          enabled: field.enabled,
          fileName: field.file?.name,
          fileSize: field.file?.size,
          fileType: field.file?.type,
        };
      }
      return field;
    });
    notifyChange(serializedData);
  }, [fields]);

  const notifyChange = (serializedData) => {
    onChange(JSON.stringify(serializedData));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const addField = () => {
    setFields([...fields, { key: "", value: "", type: "text", enabled: true }]);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    if (newFields.length === 0) {
      newFields.push({ key: "", value: "", type: "text", enabled: true });
    }
    setFields(newFields);
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (file) {
      updateField(index, {
        file,
        value: file.name,
        type: "file",
      });
    } else {
      updateField(index, {
        file: undefined,
        value: "",
        type: "text",
      });
    }
  };

  // Store files globally so they can be accessed during request execution
  const storeFilesGlobally = () => {
    const fileMap: Record<string, File> = {};
    fields.forEach((field, index) => {
      if (field.type === "file" && field.file && field.key) {
        fileMap[`${field.key}_${index}`] = field.file;
      }
    });

    // Store in a global variable that can be accessed by the request service
    (window as any).__formDataFiles = fileMap;
  };

  // Store files whenever fields change
  useEffect(() => {
    storeFilesGlobally();
  }, [fields]);

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 bg-gray-800 p-3 rounded-lg">
        <div className="font-medium mb-1">Form Data Tips:</div>
        <ul className="space-y-1">
          <li>• Use "Text" type for regular form fields</li>
          <li>• Use "File" type to upload files (images, documents, etc.)</li>
          <li>• Files will be sent as multipart/form-data</li>
          <li>• Disable fields to exclude them from the request</li>
          <li>• Selected files are stored temporarily for the request</li>
        </ul>
      </div>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Form Data</h4>
        <button
          type="button"
          onClick={addField}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
        >
          <Plus size={14} />
          <span>Add Field</span>
        </button>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={field.enabled}
              onChange={(e) =>
                updateField(index, { enabled: e.target.checked })
              }
              className="w-4 h-4 text-cyan-400 bg-gray-800 border-gray-600 rounded focus:ring-cyan-400"
            />

            <input
              type="text"
              value={field.key}
              onChange={(e) => updateField(index, { key: e.target.value })}
              placeholder="Field name"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
            />

            <div className="flex items-center space-x-2">
              <select
                value={field.type}
                onChange={(e) =>
                  updateField(index, {
                    type: e.target.value as "text" | "file",
                    value: e.target.value === "file" ? "" : field.value,
                    file: e.target.value === "file" ? undefined : field.file,
                  })
                }
                className="px-2 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              >
                <option value="text">Text</option>
                <option value="file">File</option>
              </select>

              {field.type === "text" ? (
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) =>
                    updateField(index, { value: e.target.value })
                  }
                  placeholder="Field value"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
                />
              ) : (
                <div className="flex-1 relative">
                  <input
                    type="file"
                    onChange={(e) =>
                      handleFileChange(index, e.target.files?.[0] || null)
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm border-dashed hover:border-cyan-400 transition-colors">
                    {field.file ? (
                      <>
                        <File size={16} className="text-cyan-400" />
                        <span className="truncate">{field.file.name}</span>
                        <span className="text-gray-400 text-xs">
                          ({(field.file.size / 1024).toFixed(1)} KB)
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="text-gray-400" />
                        <span className="text-gray-400">Choose file...</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeField(index)}
              className="p-2 text-gray-400 hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
