import React from 'react';
import useDelegationUIStore from '../../stores/useDelegationUIStore';
import { formatDateTimeForDisplay } from '../../utils/dateParsing';

const DelegationHistoryTable = ({ historyTasks, userRole, loading, error, resetFilters }) => {
    const { startDate, endDate, setStartDate, setEndDate, setDateFilter, searchTerm, nameFilter, setNameFilter, givenByFilter, setGivenByFilter } = useDelegationUIStore();

    return (
        <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-3 sm:p-4">
                <h2 className="text-purple-700 font-medium text-sm sm:text-base">
                    Completed Tasks History
                </h2>
            </div>

            {/* Filters */}
            <div className="p-3 sm:p-4 border-b border-purple-100 bg-gray-50">
                <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex flex-col">
                        <div className="mb-2 flex items-center">
                            <span className="text-xs sm:text-sm font-medium text-purple-700">Filter by Date Range:</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <div className="flex items-center w-full sm:w-auto">
                                <label className="text-xs sm:text-sm text-gray-700 mr-1 whitespace-nowrap">From</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="flex-1 sm:flex-none text-xs sm:text-sm border border-gray-200 rounded-md p-1"
                                />
                            </div>
                            <div className="flex items-center w-full sm:w-auto">
                                <label className="text-xs sm:text-sm text-gray-700 mr-1 whitespace-nowrap">To</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="flex-1 sm:flex-none text-xs sm:text-sm border border-gray-200 rounded-md p-1"
                                />
                            </div>
                        </div>
                    </div>
                    {(startDate || endDate || searchTerm || (nameFilter && nameFilter !== "All Names") || (givenByFilter && givenByFilter !== "All Given By")) && (
                        <button
                            onClick={() => {
                                setStartDate("");
                                setEndDate("");
                                setDateFilter("all");
                                setNameFilter("All Names");
                                setGivenByFilter("All Given By");
                            }}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-xs sm:text-sm w-full sm:w-auto"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Task ID</th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Task</th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Next Target</th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Remarks</th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Image</th>
                            {userRole === "admin" && (
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">User</th>
                            )}
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Given By</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {historyTasks.length > 0 ? (
                            historyTasks.map((history, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900">{formatDateTimeForDisplay(history.created_at)}</td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900">{history.task_id}</td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 min-w-[200px] max-w-[300px]">
                                        <div className="text-xs sm:text-sm text-gray-900 break-words" title={history.task_description}>
                                            {history.task_description || "—"}
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${history.status === "done" ? "bg-green-100 text-green-800" :
                                                history.status === "extend" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                                            }`}>
                                            {history.status || "—"}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900">
                                        {formatDateTimeForDisplay(history.next_extend_date)}
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 min-w-[150px] max-w-[250px] bg-purple-50">
                                        <div className="text-xs sm:text-sm text-gray-900 break-words" title={history.reason}>
                                            {history.reason || "—"}
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-4">
                                        {history.image_url ? (
                                            <a href={history.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline flex items-center">
                                                <img src={history.image_url} alt="Att" className="h-6 w-6 object-cover rounded-md mr-2" />
                                                View
                                            </a>
                                        ) : <span className="text-gray-400 text-xs">No file</span>}
                                    </td>
                                    {userRole === "admin" && (
                                        <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900">{history.name}</td>
                                    )}
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900">{history.given_by}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={userRole === "admin" ? 9 : 8} className="px-4 py-4 text-center text-gray-500">No records found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DelegationHistoryTable;
