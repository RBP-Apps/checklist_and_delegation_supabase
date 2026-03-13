import React, { useEffect, useState } from "react";
import AdminLayout from "../components/layout/AdminLayout";
import DelegationPage from "./delegation-data";
import useQuickTaskUIStore from "../stores/useQuickTaskUIStore";
import { useQuickTaskData } from "../hooks/useQuickTaskData";
import { useQuickTaskActions } from "../hooks/useQuickTaskActions";
import QuickTaskHeader from "../components/quicktask/QuickTaskHeader";
import ChecklistTable from "../components/quicktask/ChecklistTable";

export default function QuickTask() {
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    setUserRole(localStorage.getItem("role") || "");
  }, []);

  const {
    activeTab,
    nameFilter,
    freqFilter,
    setNameFilter,
    setFreqFilter,
    searchTerm,
  } = useQuickTaskUIStore();

  const {
    filteredChecklistTasks,
    allDepartments,
    loading,
    allNames,
    allFrequencies,
    tableContainerRef,
    handleTabChange,
    handleNameFilterSelect,
    checklistHasMore,
  } = useQuickTaskData();

  const { handleSaveEdit, handleDeleteSelected, isSaving, isDeleting, error } =
    useQuickTaskActions();

  return (
    <AdminLayout>
      <QuickTaskHeader
        loading={loading}
        allNames={allNames}
        allDepartments={allDepartments}
        allFrequencies={allFrequencies}
        onTabChange={handleTabChange}
        onNameSelect={handleNameFilterSelect}
        isDeleting={isDeleting}
        onDeleteSelected={handleDeleteSelected}
        userRole={userRole}
      />

      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-md text-red-800 text-center">
          {error}{" "}
          <button
            onClick={() => window.location.reload()}
            className="underline ml-2"
          >
            Try again
          </button>
        </div>
      )}

      {activeTab === "checklist" ? (
        (
          (
            <ChecklistTable
              tasks={filteredChecklistTasks}
              allDepartments={allDepartments}
              allNames={allNames}
              userRole={userRole}
              tableRef={tableContainerRef}
              loading={loading}
              hasMore={checklistHasMore}
              onSave={handleSaveEdit}
              onCancel={() => { }} // Cancel is handled in store call inside component
              isSaving={isSaving}
            />
          ))
      ) : (
        <DelegationPage
          searchTerm={searchTerm}
          nameFilter={nameFilter}
          freqFilter={freqFilter}
          setNameFilter={setNameFilter}
          setFreqFilter={setFreqFilter}
        />
      )}
    </AdminLayout>
  );
}
