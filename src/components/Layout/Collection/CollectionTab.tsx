import { useEffect, useRef, useState } from "react";
import { Plus, Search, Upload } from "lucide-react";
import { useApp } from "../../../contexts/AppContext";
import { useTabs } from "../../../contexts/TabContext";
import { Collection } from "../../../types";
import { CollectionItem } from "./CollectionItem";
import { CollectionModal } from "./CollectionModal";
import { RequestModal } from "./RequestModal";

export function CollectionTab() {
  const {
    collections,
    collectionsLoading,
    loadCollectionDetails,
    deleteCollection,
    deleteRequest,
    searchCollections,
    importPmCollection,
  } = useApp();
  
  const { openRequestInActiveTab } = useTabs();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Collection[]>([]);
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set()
  );
  const [showNewRequestForm, setShowNewRequestForm] = useState<string | null>(
    null
  );
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".json")) {
      alert("Please select a valid JSON file");
      return;
    }

    setImporting(true);
    try {
      await importPmCollection(file);
      alert("Collection imported successfully! Please refresh to see changes or search collection name.");
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import collection. Please check the file format.");
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
     
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      const results = await searchCollections(searchQuery);
      setSearchResults(results);
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchCollections]);

  const toggleCollection = async (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
      // Load collection details when expanding
      try {
        await loadCollectionDetails(collectionId);
      } catch (error) {
        console.error("Error loading collection details:", error);
      }
    }
    setExpandedCollections(newExpanded);
  };
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-20rem)]">
      {/* Search and Add */}
      <div className="p-4 border-b border-gray-700">
        <div className="space-y-2">
        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
          />
        </div>
        <button
          onClick={() => setShowNewCollectionForm(true)}
          className="w-full px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 flex items-center justify-center space-x-2 text-sm"
        >
          <Plus size={16} />
          <span>New Collection</span>
        </button>
          
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm transition-colors"
          >
            <Upload size={16} />
            <span>{importing ? 'Importing...' : 'Import Collection'}</span>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto">
        {collectionsLoading ? (
          <div className="p-4 text-center text-gray-400">
            Loading collections...
          </div>
        ) : (
          <div className="p-2">
            {(searchQuery ? searchResults : collections).map((collection) => (
              <CollectionItem
                key={collection._id}
                collection={collection}
                expanded={expandedCollections.has(collection._id)}
                onToggle={() => toggleCollection(collection._id)}
                onAddRequest={() => setShowNewRequestForm(collection._id)}
                onDeleteCollection={() => deleteCollection(collection._id)}
                onSelectRequest={openRequestInActiveTab}
                onDeleteRequest={deleteRequest}
              />
            ))}
          </div>
        )}
      </div>
      {/* New Collection Form Modal */}
      <CollectionModal
        isOpen={showNewCollectionForm}
        onClose={() => setShowNewCollectionForm(false)}
      />

      {/* New Request Form Modal */}
      {showNewRequestForm && (
        <RequestModal
          collectionId={showNewRequestForm}
          onClose={() => setShowNewRequestForm(null)}
        />
      )}
    </div>
  );
}
