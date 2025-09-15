import { useRef, useState, useEffect, useCallback } from "react";
import { X, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { RequestBuilder } from "../Request/RequestBuilder";
import { useTabs } from "../../contexts/TabContext";

export function TabManager() {
  const {
    tabs,
    activeTab,
    createNewTab,
    closeTab,
    switchToTab,
    updateTabRequest,
  } = useTabs();

  // Memoize the request change handler to prevent infinite re-renders
  const handleRequestChange = useCallback(
    (request: unknown) => {
      if (activeTab && request) {
        // Only update if the request actually changed
        const currentRequestString = JSON.stringify(activeTab.request);
        const newRequestString = JSON.stringify(request);
        if (currentRequestString !== newRequestString) {
          updateTabRequest(activeTab.id, request);
        }
      }
    },
    [activeTab?.id, activeTab?.request, updateTabRequest]
  );

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check if scroll buttons should be visible
  const checkScrollButtons = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const { scrollLeft, scrollWidth, clientWidth } = container;

      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Scroll tabs left or right
  const scrollTabs = (direction: "left" | "right") => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft =
        direction === "left"
          ? tabsContainerRef.current.scrollLeft - scrollAmount
          : tabsContainerRef.current.scrollLeft + scrollAmount;

      tabsContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  // Scroll active tab into view
  const scrollActiveTabIntoView = () => {
    if (tabsContainerRef.current && activeTab) {
      const activeTabElement = tabsContainerRef.current.querySelector(
        `[data-tab-id="${activeTab.id}"]`
      );
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  };

  // Handle wheel scroll on tabs
  const handleWheel = (e: React.WheelEvent) => {
    if (tabsContainerRef.current) {
      e.preventDefault();
      tabsContainerRef.current.scrollLeft += e.deltaY;
      checkScrollButtons();
    }
  };

  // Update scroll buttons when tabs change or container is resized
  useEffect(() => {
    checkScrollButtons();

    const container = tabsContainerRef.current;
    if (container) {
      const resizeObserver = new ResizeObserver(checkScrollButtons);
      resizeObserver.observe(container);

      container.addEventListener("scroll", checkScrollButtons);

      return () => {
        resizeObserver.disconnect();
        container.removeEventListener("scroll", checkScrollButtons);
      };
    }
  }, [tabs]);

  // Scroll active tab into view when it changes
  useEffect(() => {
    scrollActiveTabIntoView();
  }, [activeTab]);

  return (
    <div className="flex-1 flex flex-col bg-gray-900 min-w-0 max-w-full">
      <div className="border-b border-gray-700 bg-gray-800 min-w-0">
        <div className="flex items-center min-w-0">
          {(showLeftScroll || showRightScroll) && (
            <div className="px-2 py-1 text-xs text-gray-400 bg-gray-700 border-r border-gray-600">
              {tabs.length} tabs
            </div>
          )}

          {showLeftScroll && (
            <button
              onClick={() => scrollTabs("left")}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 border-r border-gray-700 relative"
              title="Scroll tabs left (more tabs available)"
            >
              <ChevronLeft size={16} />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            </button>
          )}

          <div
            ref={tabsContainerRef}
            className="flex-1 overflow-x-auto scrollbar-hide min-w-0"
            onWheel={handleWheel}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  data-tab-id={tab.id}
                  className={`flex items-center border-r border-gray-700 flex-shrink-0 ${
                    tab.isActive
                      ? "bg-gray-900 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                  style={{
                    minWidth: "120px",
                    maxWidth: "200px",
                    width: "150px",
                  }}
                >
                  <button
                    onClick={() => switchToTab(tab.id)}
                    className="flex-1 px-4 py-3 text-left min-w-0 truncate text-sm"
                    title={tab.name}
                  >
                    {tab.name}
                  </button>
                  {tabs.length > 1 && (
                    <button
                      onClick={() => closeTab(tab.id)}
                      className="p-2 hover:bg-gray-600 text-gray-400 hover:text-white flex-shrink-0"
                      title="Close tab"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showRightScroll && (
            <button
              onClick={() => scrollTabs("right")}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 border-l border-gray-700 relative"
              title="Scroll tabs right (more tabs available)"
            >
              <ChevronRight size={16} />
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            </button>
          )}


          <button
            onClick={createNewTab}
            className="p-3 text-white bg-purple-500 hover:text-white hover:bg-purple-600 border-l border-gray-700 flex-shrink-0"
            title="New tab"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="flex-1 flex">
        {activeTab && (
          <RequestBuilder
            key={activeTab.id}
            tabId={activeTab.id}
            initialRequest={activeTab.request}
            onRequestChange={handleRequestChange}
          />
        )}
      </div>
    </div>
  );
}
