import { useState, useEffect } from "react";
import { useApp } from "../../../contexts/AppContext";
import { useTabs } from "../../../contexts/TabContext";
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  Folder,
  MoreVertical,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { HttpRequest, Collection } from "../../../types";
import { CollectionModal } from "./CollectionModal";

interface CollectionItemProps {
  collection: Collection;
  expanded: boolean;
  onToggle: () => void;
  onAddRequest: () => void;
  onDeleteCollection: () => void;
  onSelectRequest: (request: HttpRequest) => void;
  onDeleteRequest: (collectionId: string, requestId: string) => void;
}

export function CollectionItem({
  collection,
  expanded,
  onToggle,
  onAddRequest,
  onDeleteCollection,
  onSelectRequest,
  onDeleteRequest,
}: CollectionItemProps) {
  const {
    collectionDetails,
    loadCollectionDetails,
    //  updateCollection
  } = useApp();
  
  const { openRequestInNewTab } = useTabs();
  const [showMenu, setShowMenu] = useState(false);
  const [showRequestMenu, setShowRequestMenu] = useState<string | null>(null);
  const [showEditCollection, setShowEditCollection] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );
  const [collectionMenuOpen, setCollectionMenuOpen] = useState<string | null>(
    null
  );

  const details = collectionDetails.get(collection._id);

  useEffect(() => {
    if (expanded && !details) {
      loadCollectionDetails(collection._id);
    }
  }, [expanded, details, collection._id, loadCollectionDetails]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenu(false);
      setShowRequestMenu(null);
    };

    if (showMenu || showRequestMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu, showRequestMenu]);

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setShowEditCollection(true);
    setCollectionMenuOpen(null);
  };

  return (
    <>
      <div className="mb-2">
        <div className="flex items-center justify-between p-2 hover:bg-gray-700 rounded-lg group">
          <div
            className="flex items-center space-x-2 flex-1"
            onClick={onToggle}
          >
            <button className="text-gray-400 hover:text-gray-300">
              {expanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            <Folder size={16} className="text-cyan-400" />
            <div className="flex-1">
              <div className="text-white text-sm font-medium">
                {collection.name}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {collection.description
                  ? collection.description.length > 50
                    ? collection.description.slice(0, 50) + "..."
                    : collection.description
                  : "No description"}
              </div>
              <div className="text-gray-400 text-xs">
                {collection.size} requests
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 text-gray-400 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddRequest();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Plus size={14} />
                  <span>Add Request</span>
                </button>
                <button
                  onClick={() => {
                    handleEditCollection(collection);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Edit3 size={14} />
                  <span>Edit Collection</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCollection();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {expanded && details && (
          <div className="ml-6 space-y-1">
            {details.requests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between p-2 hover:bg-gray-700 rounded group cursor-pointer relative"
                onClick={() => openRequestInNewTab(request)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowRequestMenu(showRequestMenu === request._id ? null : request._id);
                }}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs font-mono rounded ${
                      request.method === "GET"
                        ? "bg-green-500/20 text-green-400"
                        : request.method === "POST"
                        ? "bg-blue-500/20 text-blue-400"
                        : request.method === "PUT"
                        ? "bg-orange-500/20 text-orange-400"
                        : request.method === "DELETE"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {request.method}
                  </span>
                  <span className="text-white text-sm">{request.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRequestMenu(showRequestMenu === request._id ? null : request._id);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRequest(collection._id, request._id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {/* Request Context Menu */}
                {showRequestMenu === request._id && (
                  <div className="absolute right-0 top-8 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-20 min-w-[140px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRequest(request);
                        setShowRequestMenu(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 flex items-center space-x-2"
                    >
                      <span>Open in Current Tab</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openRequestInNewTab(request);
                        setShowRequestMenu(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 flex items-center space-x-2"
                    >
                      <ExternalLink size={14} />
                      <span>Open in New Tab</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRequest(collection._id, request._id);
                        setShowRequestMenu(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-600 flex items-center space-x-2"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CollectionModal
        collection={editingCollection!}
        isOpen={showEditCollection}
        onClose={() => {
          setShowEditCollection(false);
          setEditingCollection(null);
        }}
      />
    </>
  );
}
