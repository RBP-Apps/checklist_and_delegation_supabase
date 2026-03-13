import React, { useEffect, useRef } from "react";
import { Search, ChevronDown, Filter, Trash2, X } from "lucide-react";
import useQuickTaskUIStore from "../../stores/useQuickTaskUIStore";
import { CONFIG } from "../../config/quickTaskConfig";

const QuickTaskHeader = ({
  loading,
  allNames,
  allDepartments,
  allFrequencies,
  onTabChange,
  onNameSelect,
  isDeleting,
  onDeleteSelected,
  userRole,
}) => {
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    nameFilter,
    setNameFilter,
    freqFilter,
    setFreqFilter,
    dropdownOpen,
    toggleDropdown,
    closeDropdowns,
    selectedTasks,
  } = useQuickTaskUIStore();

  const nameFilterRef = useRef(null);
  const freqFilterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (dropdownOpen.name &&
          nameFilterRef.current &&
          !nameFilterRef.current.contains(event.target)) ||
        (dropdownOpen.frequency &&
          freqFilterRef.current &&
          !freqFilterRef.current.contains(event.target))
      ) {
        closeDropdowns();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen, closeDropdowns]);

  return (
    <div className="sticky top-0 z-30 bg-white pb-4 border-b border-gray-200">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-purple-700">
            {CONFIG.PAGE_CONFIG.title}
          </h1>
          <p className="text-purple-600 text-sm">
            {activeTab === "checklist" ? "Checklist Tasks" : "Delegation Tasks"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Tabs */}
          <div className="flex border border-purple-200 rounded-md overflow-hidden self-start">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === "checklist" ? "bg-purple-600 text-white" : "bg-white text-purple-600 hover:bg-purple-50"}`}
              onClick={() => {
                setActiveTab("checklist");
                onTabChange("checklist");
              }}
            >
              Checklist
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === "delegation" ? "bg-purple-600 text-white" : "bg-white text-purple-600 hover:bg-purple-50"}`}
              onClick={() => {
                setActiveTab("delegation");
                onTabChange("delegation");
              }}
            >
              Delegation
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            {/* Name Filter */}
            <div className="relative" ref={nameFilterRef}>
              <button
                onClick={() => toggleDropdown("name")}
                className="flex items-center gap-2 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                {nameFilter || "All Names"}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${dropdownOpen.name ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen.name && (
                <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto top-full right-0">
                  <button
                    onClick={() => {
                      setNameFilter("");
                      onNameSelect("");
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    All Names
                  </button>
                  {allNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        setNameFilter(name);
                        onNameSelect(name);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Frequency Filter */}
            <div className="relative" ref={freqFilterRef}>
              <button
                onClick={() => toggleDropdown("frequency")}
                className="flex items-center gap-2 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                {freqFilter || "Filter Frequency"}
                <ChevronDown
                  size={16}
                  className={dropdownOpen.frequency ? "rotate-180" : ""}
                />
              </button>
              {dropdownOpen.frequency && (
                <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
                  <button
                    onClick={() => {
                      setFreqFilter("");
                      closeDropdowns();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    All
                  </button>
                  {allFrequencies.map((freq) => (
                    <button
                      key={freq}
                      onClick={() => {
                        setFreqFilter(freq);
                        closeDropdowns();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Button */}
            {userRole === "admin" &&
              selectedTasks.length > 0 &&
              activeTab === "checklist" && (
                <button
                  onClick={onDeleteSelected}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {isDeleting
                    ? "Deleting..."
                    : `Delete (${selectedTasks.length})`}
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickTaskHeader;
