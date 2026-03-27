"use client";
import React from "react";
import {
  CheckCircle2,
  X,
  Search,
  Edit,
  Save,
  XCircle,
  ClipboardList,
  Users,
  Calendar,
  FilterX,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import useApprovalStore from "../../store/useApprovalStore";
import { useApprovalData } from "../../hooks/useApprovalData";
import Modal from "../../components/common/Modal";

// Configuration object
const CONFIG = {
  PAGE_CONFIG: {
    historyTitle: "Approval Pending Tasks",
    description: "Showing today, tomorrow's tasks and past due tasks",
    historyDescription:
      "Read-only view of completed tasks with submission history (excluding admin-processed items)",
  },
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, itemCount, onConfirm, onCancel }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Mark Items as Admin Done"
      maxWidth="sm:max-w-md"
    >
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-yellow-100 text-yellow-600 rounded-full p-3 mr-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to mark {itemCount}{" "}
          {itemCount === 1 ? "item" : "items"} as Admin Done?
        </p>

        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

function Approval() {
  const {
    activeApprovalTab,
    setActiveApprovalTab,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    successMessage,
    setSuccessMessage,
    memberSearchTerm,
    setMemberSearchTerm,
    showMemberDropdown,
    setShowMemberDropdown,
    selectedMembers,
    handleMemberSelection,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedHistoryItems,
    setSelectedHistoryItems,
    editingRows,
    editedAdminStatus,
    setEditedAdminStatus,
    savingEdits,
    confirmationModal,
    setConfirmationModal,
    markingAsDone,
    resetFilters,
    historyData,
    delegationHistoryData
  } = useApprovalStore();

  const {
    filteredHistoryData,
    filteredDelegationHistoryData,
    getFilteredMembersList,
    userRole,
    handleEditClick,
    handleCancelEdit,
    handleSaveEdit,
    handleMarkMultipleDone,
    confirmMarkDone
  } = useApprovalData();

  const isAdmin = userRole === "admin";
  const currentData = activeApprovalTab === 'checklist' ? filteredHistoryData : filteredDelegationHistoryData;

  const getTaskStatistics = () => {
    // Determine source data based on active tab
    const sourceData = activeApprovalTab === 'checklist' ? historyData : delegationHistoryData;

    // A task is considered "Done" if its status is "Yes" (case-insensitive)
    const isDone = (task) => task.status && task.status.toString().toLowerCase() === 'yes';

    // Total should be all "Yes" tasks in the current tab (unfiltered by user selection, only pre-fetched from DB)
    const totalCompleted = sourceData.filter(isDone).length;

    // Filtered total should be "Yes" tasks matching CURRENT filters
    const filteredTotal = currentData.filter(isDone).length;

    const memberStats = selectedMembers.length > 0
      ? selectedMembers.reduce((stats, member) => {
        const memberTasks = currentData.filter(
          (task) => task.name === member && isDone(task)
        ).length;
        return {
          ...stats,
          [member]: memberTasks,
        };
      }, {})
      : {};

    return {
      totalCompleted,
      filteredTotal,
      memberStats
    }
  };

  const isEmpty = (value) => {
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    );
  };


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-purple-900">
                  {CONFIG.PAGE_CONFIG.historyTitle}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage and approve task submissions efficiently
                </p>
              </div>

              {/* Tab Styling Enhanced */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveApprovalTab('checklist')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${activeApprovalTab === 'checklist'
                    ? 'bg-white text-purple-700 shadow-sm ring-1 ring-purple-100'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                >
                  <ClipboardList className={`h-4 w-4 ${activeApprovalTab === 'checklist' ? 'text-purple-600' : 'text-gray-400'}`} />
                  Checklist Tasks
                </button>
                <button
                  onClick={() => setActiveApprovalTab('delegation')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${activeApprovalTab === 'delegation'
                    ? 'bg-white text-purple-700 shadow-sm ring-1 ring-purple-100'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                >
                  <Users className={`h-4 w-4 ${activeApprovalTab === 'delegation' ? 'text-purple-600' : 'text-gray-400'}`} />
                  Delegation Tasks
                </button>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                {successMessage}
              </div>
              <button
                onClick={() => setSuccessMessage("")}
                className="text-green-500 hover:text-green-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">


            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-purple-600">Loading task data...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
                {error}{" "}
                <button
                  className="underline ml-2"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {/* History Filters - Single Row Design */}
                <div className="p-4 border-b border-purple-100 bg-white shadow-inner">
                  <div className="flex flex-wrap items-end gap-6">
                    {getFilteredMembersList().length > 0 && userRole === "admin" && (
                      <div className="flex-1 min-w-[250px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Users className="h-3 w-3" /> Filter by Member Name
                        </label>
                        <div className="relative">
                          <div className="relative group">
                            <input
                              type="text"
                              placeholder="Search member name..."
                              value={memberSearchTerm}
                              onChange={(e) =>
                                setMemberSearchTerm(e.target.value)
                              }
                              onFocus={() => setShowMemberDropdown(true)}
                              className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                            <Search
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-purple-500 transition-colors"
                              size={16}
                            />
                          </div>

                          {showMemberDropdown && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto ring-1 ring-black/5">
                              <div className="p-2 border-b border-gray-50 sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Select Member Names</span>
                                <button
                                  onClick={() => setShowMemberDropdown(false)}
                                  className="p-1 hover:bg-gray-100 rounded-md text-gray-400"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                              {getFilteredMembersList()
                                .filter((member) =>
                                  member
                                    .toLowerCase()
                                    .includes(memberSearchTerm.toLowerCase())
                                )
                                .map((member, idx) => (
                                  <div
                                    key={idx}
                                    className={`flex items-center px-4 py-2.5 hover:bg-purple-50 cursor-pointer transition-colors ${selectedMembers.includes(member) ? 'bg-purple-50/50' : ''}`}
                                    onClick={() => handleMemberSelection(member)}
                                  >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedMembers.includes(member) ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 bg-white'}`}>
                                      {selectedMembers.includes(member) && <CheckCircle2 size={10} />}
                                    </div>
                                    <label className={`ml-3 text-sm cursor-pointer flex-1 transition-colors ${selectedMembers.includes(member) ? 'text-purple-900 font-medium' : 'text-gray-700'}`}>
                                      {member}
                                    </label>
                                  </div>
                                ))}
                              {getFilteredMembersList().filter((member) =>
                                member
                                  .toLowerCase()
                                  .includes(memberSearchTerm.toLowerCase())
                              ).length === 0 && (
                                  <div className="px-4 py-8 text-center">
                                    <Search className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">No members found</p>
                                  </div>
                                )}
                            </div>
                          )}

                          {selectedMembers.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {selectedMembers.map((member, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center pl-2 pr-1 py-1 bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold uppercase tracking-wider animate-in fade-in zoom-in duration-200"
                                >
                                  {member}
                                  <button
                                    onClick={() => handleMemberSelection(member)}
                                    className="ml-1 p-0.5 hover:bg-purple-200 rounded transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date Range
                      </label>
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
                        <div className="flex items-center">
                          <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-sm p-1.5 focus:outline-none cursor-pointer"
                          />
                        </div>
                        <div className="px-2 text-gray-400 text-xs font-bold">TO</div>
                        <div className="flex items-center">
                          <input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-sm p-1.5 focus:outline-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Task Completion Statistics - Integrated into Filter Row */}
                    <div className="flex-1 flex flex-wrap items-end gap-3 justify-end ml-auto">
                      <div className="flex items-center gap-2 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100/50">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-blue-400 uppercase leading-none mb-1">
                            {activeApprovalTab === 'checklist' ? 'Checklist' : 'Delegation'} Done
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-blue-700 leading-none">
                                {getTaskStatistics().totalCompleted}
                              </span>
                              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Tasks</span>
                            </div>

                            {(selectedMembers.length > 0 || startDate || endDate || searchTerm) && (
                              <div className="flex items-center gap-1.5 pl-2 ml-2 border-l border-blue-200">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase leading-none">Filtered</span>
                                <span className="text-lg font-black text-indigo-700 leading-none">
                                  {getTaskStatistics().filteredTotal}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Member Statistics - Small Pills */}
                      <div className="flex flex-wrap gap-2 max-w-[400px]">
                        {selectedMembers.slice(0, 3).map((member) => (
                          <div
                            key={member}
                            className="px-2 py-1 bg-white rounded-md border border-purple-100 shadow-sm flex items-center gap-2"
                          >
                            <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[60px]">{member}</span>
                            <span className="text-xs font-black text-purple-600">
                              {getTaskStatistics().memberStats[member]}
                            </span>
                          </div>
                        ))}
                        {selectedMembers.length > 3 && (
                          <div className="px-2 py-1 bg-gray-50 rounded-md border border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                            +{selectedMembers.length - 3} More
                          </div>
                        )}
                      </div>
                    </div>


                    <div className="flex items-center gap-2 pb-1">
                      {(selectedMembers.length > 0 || startDate || endDate || searchTerm) && (
                        <button
                          onClick={resetFilters}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-bold border border-red-100 group"
                        >
                          <FilterX className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* NEW: Confirmation Modal */}
                <ConfirmationModal
                  isOpen={confirmationModal.isOpen}
                  itemCount={confirmationModal.itemCount}
                  onConfirm={confirmMarkDone}
                  onCancel={() =>
                    setConfirmationModal({ isOpen: false, itemCount: 0 })
                  }
                />

                {/* Action Bar - Floating or prominent when items selected */}
                {userRole === "admin" && selectedHistoryItems.length > 0 && (
                  <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-600 text-white p-1.5 rounded-lg shadow-sm">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-900">
                          {selectedHistoryItems.length} Items Selected
                        </p>
                        <p className="text-[11px] text-green-700 font-medium">
                          You are about to mark these as "Admin Done"
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleMarkMultipleDone}
                      disabled={markingAsDone}
                      className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 transition-all font-bold text-sm flex items-center hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                    >
                      {markingAsDone ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve Selected
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* History Table - Based on Active Tab */}
                <div className="hidden sm:block h-[calc(100vh-300px)] overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        {/* Admin Done Column - Refined */}
                        {userRole === "admin" && (
                          <th className="px-4 py-3 text-left text-[10px] font-extrabold text-purple-900 uppercase tracking-widest bg-purple-50/50 border-r border-purple-100 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3" />
                              Admin Status
                            </div>
                          </th>
                        )}

                        {/* Admin Select Column Header - Refined */}
                        {userRole === "admin" && (
                          <th className="px-4 py-3 text-center text-[10px] font-extrabold text-green-900 uppercase tracking-widest bg-green-50/50 w-24 border-r border-green-100">
                            <div className="flex flex-col items-center gap-1.5">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500 transition-all cursor-pointer"
                                checked={
                                  currentData.filter(
                                    (item) => {
                                      return isEmpty(item.admin_done) ||
                                        (item.admin_done.toString().trim() !== "Done" &&
                                          item.admin_done.toString().trim() !== "Not Done");
                                    }
                                  ).length > 0 &&
                                  selectedHistoryItems.length ===
                                  currentData.filter(
                                    (item) => {
                                      return isEmpty(item.admin_done) ||
                                        (item.admin_done.toString().trim() !== "Done" &&
                                          item.admin_done.toString().trim() !== "Not Done");
                                    }
                                  ).length
                                }
                                onChange={(e) => {
                                  const unprocessedItems = currentData.filter((item) => {
                                    return isEmpty(item.admin_done) ||
                                      (item.admin_done.toString().trim() !== "Done" &&
                                        item.admin_done.toString().trim() !== "Not Done");
                                  });
                                  if (e.target.checked) {
                                    setSelectedHistoryItems(unprocessedItems);
                                  } else {
                                    setSelectedHistoryItems([]);
                                  }
                                }}
                              />
                              <span>Bulk Select</span>
                            </div>
                          </th>
                        )}

                        {/* SUB CATEGORY column (Renamed from Department) */}
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                          Sub Category
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                          Member Name
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                          Task Description
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 min-w-[140px]">
                          Task End Date & Time
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                          frequency
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                          Require Attachment
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 min-w-[140px]">
                          Actual Date & Time
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 min-w-[80px]">
                          Status
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50 min-w-[150px]">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={
                              (userRole === "admin" ? 2 : 0) + // Admin Done + Admin checkbox columns
                              (userRole !== "admin" ? 1 : 0) + // Task ID column
                              (userRole !== "admin" && isAdmin ? 3 : 0) + // Department, Given By, Name columns
                              8 + // Fixed columns (Sub Category, Member Name, Task Description, End Date, frequency, Require Attachment, Actual Date, Status, Remarks, Attachment)
                              (userRole !== "admin" && isAdmin ? 1 : 0) // Enable Reminders column
                            }
                            className="px-6 py-8 text-center"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                              <p className="text-purple-600">Loading task data...</p>
                            </div>
                          </td>
                        </tr>
                      ) : currentData.length > 0 ? (
                        currentData.map((history) => {
                          const isInEditMode = editingRows.has(history._id);
                          const isSaving = savingEdits.has(history._id);

                          return (
                            <tr key={history._id} className="hover:bg-gray-50">
                              {/* FIRST: Admin Status Column - Refined */}
                              {userRole === "admin" && (
                                <td className="px-4 py-4 bg-purple-50/20 border-r border-purple-50 min-w-[140px]">
                                  {isInEditMode ? (
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={editedAdminStatus[history._id] || "Not Done"}
                                        onChange={(e) =>
                                          setEditedAdminStatus((prev) => ({
                                            ...prev,
                                            [history._id]: e.target.value,
                                          }))
                                        }
                                        className="text-xs font-bold border border-purple-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                        disabled={isSaving}
                                      >
                                        <option value="Not Done">Not Done</option>
                                        <option value="Done">Done</option>
                                      </select>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleSaveEdit(history)}
                                          disabled={isSaving}
                                          className="p-1.5 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                                          title="Save changes"
                                        >
                                          {isSaving ? (
                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                          ) : (
                                            <Save className="h-3.5 w-3.5" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => handleCancelEdit(history._id)}
                                          disabled={isSaving}
                                          className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
                                          title="Cancel editing"
                                        >
                                          <XCircle className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between group">
                                      <div className="flex-1">
                                        {!isEmpty(history.admin_done) &&
                                          history.admin_done.toString().trim() === "Done" ? (
                                          <div className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-green-200">
                                            <CheckCircle2 className="h-3 w-3 mr-1.5" />
                                            Admin Done
                                          </div>
                                        ) : !isEmpty(history.admin_done) &&
                                          history.admin_done.toString().trim() === "Not Done" ? (
                                          <div className="inline-flex items-center px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-red-200">
                                            <XCircle className="h-3 w-3 mr-1.5" />
                                            Admin Refused
                                          </div>
                                        ) : (
                                          <div className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-yellow-200">
                                            <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse mr-2" />
                                            Awaiting Review
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => handleEditClick(history)}
                                        className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-md transition-all ml-2"
                                        title="Quick Edit"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* SECOND: Admin Select Checkbox - Action Column - Refined */}
                              {userRole === "admin" && (
                                <td className="px-4 py-4 w-24 border-r border-green-50 bg-green-50/10">
                                  {!isEmpty(history.admin_done) &&
                                    (history.admin_done.toString().trim() === "Done" ||
                                      history.admin_done.toString().trim() === "Not Done") ? (
                                    <div className="flex flex-col items-center opacity-60">
                                      <div
                                        className={`p-1 rounded-full ${history.admin_done.toString().trim() === "Done"
                                          ? "bg-green-100 text-green-600"
                                          : "bg-red-100 text-red-600"
                                          }`}
                                      >
                                        {history.admin_done.toString().trim() === "Done" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                      </div>
                                      <span className="text-[9px] mt-1 font-bold uppercase tracking-tight text-gray-500">Processed</span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1">
                                      <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-green-300 text-green-600 focus:ring-green-500 transition-all cursor-pointer hover:scale-110"
                                        checked={selectedHistoryItems.some(item => item._id === history._id)}
                                        onChange={() => {
                                          setSelectedHistoryItems(prev =>
                                            prev.some(item => item._id === history._id)
                                              ? prev.filter(item => item._id !== history._id)
                                              : [...prev, history]
                                          );
                                        }}
                                      />
                                      <span className="text-[9px] font-extrabold text-green-700 uppercase leading-none">Select</span>
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* SUB CATEGORY column */}
                              <td className="px-3 py-4 min-w-[120px]">
                                <div className="text-sm text-gray-900 break-words font-medium">
                                  {history.department || "—"}
                                </div>
                              </td>

                              <td className="px-3 py-4 min-w-[150px]">
                                <div className="text-sm text-gray-900 break-words">
                                  {history.name || "—"}
                                </div>
                              </td>

                              <td className="px-3 py-4 min-w-[200px]">
                                <div className="text-sm text-gray-900 break-words" title={history.task_description}>
                                  {history.task_description || "—"}
                                </div>
                              </td>

                              <td className="px-3 py-4 bg-yellow-50 min-w-[140px]">
                                <div className="text-sm text-gray-900 break-words">
                                  {history.task_start_date ? (
                                    <div>
                                      <div className="font-medium break-words text-gray-800">
                                        {history.task_start_date.includes(" ") ? history.task_start_date.split(" ")[0] : history.task_start_date}
                                      </div>
                                      {history.task_start_date.includes(" ") && (
                                        <div className="text-xs text-gray-500 break-words">
                                          {history.task_start_date.split(" ")[1]}
                                        </div>
                                      )}
                                    </div>
                                  ) : "—"}
                                </div>
                              </td>

                              <td className="px-3 py-4 min-w-[80px]">
                                <div className="text-sm text-gray-900 break-words">
                                  {history.frequency || "—"}
                                </div>
                              </td>

                              <td className="px-3 py-4 min-w-[120px]">
                                <div className="text-sm text-gray-900 break-words">
                                  {history.require_attachment || "—"}
                                </div>
                              </td>

                              <td className="px-3 py-4 bg-green-50 min-w-[140px]">
                                <div className="text-sm text-gray-900 break-words">
                                  {history.submission_date ? (
                                    <div>
                                      <div className="font-medium break-words text-gray-800">
                                        {history.submission_date.includes(" ") ? history.submission_date.split(" ")[0] : history.submission_date}
                                      </div>
                                      {history.submission_date.includes(" ") && (
                                        <div className="text-xs text-gray-500 break-words">
                                          {history.submission_date.split(" ")[1]}
                                        </div>
                                      )}
                                    </div>
                                  ) : "—"}
                                </div>
                              </td>

                              <td className="px-3 py-4 bg-blue-50 min-w-[80px]">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full break-words ${history.status === "Yes"
                                    ? "bg-green-100 text-green-800"
                                    : history.status === "No"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                  {history.status || "—"}
                                </span>
                              </td>

                              <td className="px-3 py-4 bg-purple-50 min-w-[150px]">
                                <div className="text-sm text-gray-900 break-words" title={history.remark}>
                                  {history.remark || "—"}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={
                              (userRole === "admin" ? 2 : 0) + // Admin Done + Admin checkbox columns
                              1 + // Task ID column (now visible for all)
                              (isAdmin ? 3 : 0) + // Name, Department, Given By columns
                              8 + // Fixed columns (Sub Category, Member Name, Task Description, Planned Date, Actual Date, Status, frequency, Require Attachment, Remarks)
                              (isAdmin ? 1 : 0) // Enable Reminders column
                            }
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            {searchTerm || selectedMembers.length > 0 || startDate || endDate
                              ? "No historical records matching your filters"
                              : `No completed ${activeApprovalTab} records found`}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-4 p-4 max-h-[calc(100vh-300px)] overflow-auto">
                  {currentData.length > 0 ? (
                    currentData.map((history) => {
                      const isInEditMode = editingRows.has(history._id);
                      const isSaving = savingEdits.has(history._id);

                      return (
                        <div
                          key={history._id}
                          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                        >
                          {/* Mobile card content - replicate your table row data here */}
                          <div className="space-y-3">
                            {userRole === "admin" && (
                              <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium text-gray-700">Admin Done Status:</span>
                                {isInEditMode ? (
                                  <div className="flex items-center space-x-2">
                                    <select
                                      value={editedAdminStatus[history._id] || "Not Done"}
                                      onChange={(e) =>
                                        setEditedAdminStatus((prev) => ({
                                          ...prev,
                                          [history._id]: e.target.value,
                                        }))
                                      }
                                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      disabled={isSaving}
                                    >
                                      <option value="Not Done">Not Done</option>
                                      <option value="Done">Done</option>
                                    </select>
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => handleSaveEdit(history)}
                                        disabled={isSaving}
                                        className="p-1 text-green-600 hover:text-green-800"
                                      >
                                        <Save className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleCancelEdit(history._id)}
                                        className="p-1 text-red-600 hover:text-red-800"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    {!isEmpty(history.admin_done) && history.admin_done.toString().trim() === "Done" ? (
                                      <span className="text-green-600 text-sm font-medium">Done</span>
                                    ) : (
                                      <span className="text-red-600 text-sm font-medium">Pending</span>
                                    )}
                                    <button
                                      onClick={() => handleEditClick(history)}
                                      className="p-1 text-blue-600 hover:text-blue-800 ml-2"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {userRole === "admin" && (
                              <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium text-gray-700">Action:</span>
                                <div className="flex flex-col items-center">
                                  <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-gray-300 text-green-600"
                                    checked={selectedHistoryItems.some(item => item._id === history._id)}
                                    onChange={() => {
                                      setSelectedHistoryItems(prev =>
                                        prev.some(item => item._id === history._id)
                                          ? prev.filter(item => item._id !== history._id)
                                          : [...prev, history]
                                      );
                                    }}
                                  />
                                  <span className="text-[10px] text-gray-500 mt-1 uppercase font-semibold">Mark Done</span>
                                </div>
                              </div>
                            )}

                            <div>
                              <span className="font-medium text-gray-700">Sub Category:</span>
                              <p className="mt-1 text-gray-900">{history.department || "—"}</p>
                            </div>

                            <div>
                              <span className="font-medium text-gray-700">Member Name:</span>
                              <p className="mt-1 text-gray-900">{history.name || "—"}</p>
                            </div>

                            <div>
                              <span className="font-medium text-gray-700">Task:</span>
                              <p className="mt-1 text-gray-900">{history.task_description || "—"}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium text-gray-700">End Date:</span>
                                <p className="text-sm text-gray-900">{history.planned_date || "—"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Actual Date:</span>
                                <p className="text-sm text-gray-900">{history.submission_date || "—"}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium text-gray-700">Status:</span>
                                <p className="text-sm text-gray-900">{history.status || "—"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">frequency:</span>
                                <p className="text-sm text-gray-900">{history.frequency || "—"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      {searchTerm ||
                        selectedMembers.length > 0 ||
                        startDate ||
                        endDate
                        ? "No historical records matching your filters"
                        : "No completed records found"}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Approval;