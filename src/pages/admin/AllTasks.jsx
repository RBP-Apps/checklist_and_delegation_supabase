import { useEffect } from "react";
import useAllTasksStore from "../../store/useAllTasksStore";
import { useAllTasksData } from "../../hooks/useAllTasksData";

const AllTasks = () => {
  // Store state
  const {
    tableHeaders,
    selectedTasks,
    selectedColumnValues,
    selectedFiles,
    searchQuery,
    filterStatus,
    filterFrequency,
    currentPage,
    isLoading,
    isSubmitting,
    error,
    toast,
    username,
    isAdmin,
    setSearchQuery,
    setFilterStatus,
    setFilterFrequency,
    toggleTaskSelection,
    toggleAllTasks,
    handleColumnOChange,
  } = useAllTasksStore();

  // Data hook
  const {
    filteredPaginatedTasks,
    formatDate,
    lastTaskElementRef,
    handleFileSelect,
    handleSubmit,
    handleLogout,
  } = useAllTasksData();

  // Render loading state
  if (isLoading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and logout button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-purple-700">
          {isAdmin ? "All Tasks (Admin View)" : `My Tasks (${username})`}
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Search and filter section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-purple-700">All Tasks</h1>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedTasks.length === 0}
          className={`px-5 py-2 mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md shadow-md transition duration-200 ease-in-out ${isSubmitting || selectedTasks.length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {isSubmitting ? "Processing..." : `Submit Selected Tasks (${selectedTasks.length})`}
        </button>
      </div>

      {/* Tasks table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Filter inputs */}
        <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Frequencies</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Tasks table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === filteredPaginatedTasks.length && filteredPaginatedTasks.length > 0}
                    onChange={() => toggleAllTasks(filteredPaginatedTasks.map(t => t._id))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </th>
                {tableHeaders.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.label}
                  </th>
                ))}
                {/* Column O */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Column O
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Image
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPaginatedTasks.length > 0 ? (
                filteredPaginatedTasks.map((task, index) => (
                  <tr
                    key={task._id}
                    ref={index === filteredPaginatedTasks.length - 1 ? lastTaskElementRef : null}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task._id)}
                        onChange={() => toggleTaskSelection(task._id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    </td>
                    {tableHeaders.map((header) => (
                      <td key={header.id} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {header.label.toLowerCase().includes('date')
                          ? formatDate(task[header.id])
                          : task[header.id] || '—'}
                      </td>
                    ))}
                    {/* Column O input */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {selectedTasks.includes(task._id) ? (
                        <input
                          type="text"
                          value={selectedColumnValues[task._id] || ''}
                          onChange={(e) => handleColumnOChange(task._id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter value for Column O"
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                    {/* Upload Image section */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          id={`file-${task._id}`}
                          onChange={(e) => handleFileSelect(task._id, e)}
                          className="hidden"
                          accept="image/*"
                          disabled={!selectedTasks.includes(task._id)}
                        />
                        <label
                          htmlFor={`file-${task._id}`}
                          className={`px-3 py-2 rounded cursor-pointer transition flex items-center justify-center ${selectedTasks.includes(task._id)
                              ? "bg-blue-500 text-white hover:bg-blue-600"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                          Upload Image
                        </label>
                        {selectedFiles[task._id] && (
                          <span className="text-xs text-gray-500">
                            {selectedFiles[task._id].name.length > 15
                              ? selectedFiles[task._id].name.substring(0, 15) + '...'
                              : selectedFiles[task._id].name}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableHeaders.length + 3} className="px-6 py-4 text-center text-gray-500">
                    {searchQuery ? "No tasks found matching the search" : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Loading indicator for pagination */}
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${toast.type === "success"
            ? "bg-green-100 text-green-800 border-l-4 border-green-500"
            : "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AllTasks;