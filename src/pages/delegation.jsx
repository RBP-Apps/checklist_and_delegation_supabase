import React from 'react';
import AdminLayout from "../components/layout/AdminLayout";
import useDelegationUIStore from '../stores/useDelegationUIStore';
import { useDelegationData } from '../hooks/useDelegationData';
import { useDelegationActions } from '../hooks/useDelegationActions';

import DelegationHeader from '../components/delegation/DelegationHeader';
import DelegationTable from '../components/delegation/DelegationTable';
import DelegationHistoryTable from '../components/delegation/DelegationHistoryTable';

function DelegationDataPage() {
  // 1. Data Hook
  const {
    loading,
    error,
    activeTasks,
    historyTasks,
    userRole,
    users,
    givenByList,
    refreshData
  } = useDelegationData();

  // 2. Actions Hook
  const {
    handleSubmit,
    isSubmitting,
    successMessage,
    setSuccessMessage
  } = useDelegationActions(activeTasks, refreshData);

  // 3. UI Store (for toggling views)
  const { showHistory, resetFilters } = useDelegationUIStore();

  return (
    <AdminLayout>
      <DelegationHeader
        activeCount={activeTasks.length}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        successMessage={successMessage}
        setSuccessMessage={setSuccessMessage}
        users={users}
        givenByList={givenByList}
      />

      <div className="mt-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-purple-600 text-sm sm:text-base">Loading task data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800 text-center text-sm sm:text-base">
            {error}
            <button className="underline ml-2" onClick={() => window.location.reload()}>Try again</button>
          </div>
        ) : showHistory ? (
          <DelegationHistoryTable
            historyTasks={historyTasks}
            userRole={userRole}
            loading={loading}
            error={error}
            resetFilters={resetFilters}
          />
        ) : (
          <DelegationTable tasks={activeTasks} />
        )}
      </div>
    </AdminLayout>
  );
}

export default DelegationDataPage;
