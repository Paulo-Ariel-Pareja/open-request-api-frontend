import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useApp } from "../../../contexts/AppContext";
import { Collection } from "../../../types";
import { CollectionItem } from "./CollectionItem";
import { CollectionModal } from "./CollectionModal";
import { RequestModal } from "./RequestModal";

export function CollectionTab() {
  const {
    collections,
    collectionsLoading,
    loadCollectionDetails,
    setActiveRequest,
    deleteCollection,
    deleteRequest,
    searchCollections,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Collection[]>([]);
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set()
  );
  const [showNewRequestForm, setShowNewRequestForm] = useState<string | null>(
    null
  );

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        const results = await searchCollections(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
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
                onSelectRequest={setActiveRequest}
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
