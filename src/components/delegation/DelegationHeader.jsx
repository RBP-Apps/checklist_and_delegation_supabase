import React from 'react';
import { Search, Filter, History, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import useDelegationUIStore from '../../stores/useDelegationUIStore';
import { CONFIG } from '../../config/delegationConfig';

const DelegationHeader = ({
    activeCount,
    handleSubmit,
    isSubmitting,
    successMessage,
    setSuccessMessage,
    users = [],
    givenByList = []
}) => {
    const {
        showHistory, toggleHistory,
        searchTerm, setSearchTerm,
        dateFilter, setDateFilter,
        nameFilter, setNameFilter,
        givenByFilter, setGivenByFilter,
        selectedItems
    } = useDelegationUIStore();

    const selectedCount = selectedItems.size;

    return (
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
            <div className="flex flex-col gap-3 sm:gap-4">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-purple-700">
                    {showHistory ? CONFIG.PAGE_CONFIG.historyTitle : CONFIG.PAGE_CONFIG.title}
                </h1>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={showHistory ? "Search by Task ID..." : "Search tasks..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                        />
                    </div>

                    {/* Label & Name Filters */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {!showHistory && (
                            <div className="relative w-full sm:w-48">
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="w-full appearance-none bg-white border border-purple-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base pr-10"
                                >
                                    <option value="all">All Labels</option>
                                    <option value="today">Today</option>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-purple-500">
                                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                    </svg>
                                </div>
                            </div>
                        )}

                        <div className="relative w-full sm:w-48">
                            <select
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="w-full appearance-none bg-white border border-purple-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base pr-10"
                            >
                                <option value="All Names">All Names</option>
                                {users.map((name, index) => (
                                    <option key={index} value={name}>{name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-purple-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>

                        <div className="relative w-full sm:w-48">
                            <select
                                value={givenByFilter}
                                onChange={(e) => setGivenByFilter(e.target.value)}
                                className="w-full appearance-none bg-white border border-purple-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base pr-10"
                            >
                                <option value="All Given By">All Given By</option>
                                {givenByList.map((name, index) => (
                                    <option key={index} value={name}>{name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-purple-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={toggleHistory}
                            className="flex-1 sm:flex-none rounded-md gradient-bg py-2 px-3 sm:px-4 text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base"
                        >
                            {showHistory ? (
                                <div className="flex items-center justify-center">
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Back to Tasks</span>
                                    <span className="sm:hidden">Back</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <History className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">View History</span>
                                    <span className="sm:hidden">History</span>
                                </div>
                            )}
                        </button>

                        {!showHistory && (
                            <button
                                onClick={handleSubmit}
                                disabled={selectedCount === 0 || isSubmitting}
                                className="flex-1 sm:flex-none rounded-md gradient-bg py-2 px-3 sm:px-4 text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                                {isSubmitting ? "Processing..." : (
                                    <>
                                        <span className="hidden sm:inline">Submit Selected ({selectedCount})</span>
                                        <span className="sm:hidden">Submit ({selectedCount})</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-3 rounded-md flex items-center justify-between text-sm sm:text-base">
                    <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-500 flex-shrink-0" />
                        <span className="break-words">{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-700 ml-2 flex-shrink-0">
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default DelegationHeader;
