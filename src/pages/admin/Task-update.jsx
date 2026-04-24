//Tasks Update Page
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    CheckCircle2,
    X,
    Search,
} from "lucide-react";

import AdminLayout from "../../components/layout/AdminLayout";
import supabase from "../../SupabaseClient";
import Select from "react-select";

const customStyles = {
    control: (base, state) => ({
        ...base,
        borderColor: state.isFocused ? '#a855f7' : '#e9d5ff',
        boxShadow: state.isFocused ? '0 0 0 1px #a855f7' : 'none',
        '&:hover': {
            borderColor: '#a855f7'
        },
        borderRadius: '0.375rem',
        minHeight: '38px',
        fontSize: '0.875rem' // text-sm
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#a855f7' : state.isFocused ? '#f3e8ff' : 'white',
        color: state.isSelected ? 'white' : '#374151',
        cursor: 'pointer',
        fontSize: '0.875rem'
    }),
    singleValue: (base) => ({
        ...base,
        color: '#374151',
    }),
    menu: (base) => ({
        ...base,
        zIndex: 9999
    }),

     menuPortal: (base) => ({
    ...base,
    zIndex: 9999
  })
};


function AccountDataPage() {
    const [accountData, setAccountData] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [additionalData, setAdditionalData] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [remarksData, setRemarksData] = useState({});
    const [selectedTaskDescription, setSelectedTaskDescription] =
        useState("All Tasks");
    const [taskDescriptionList, setTaskDescriptionList] = useState([]);

    const [membersList, setMembersList] = useState([]);

    const [selectedName, setSelectedName] = useState("All Names");

    const [userRole, setUserRole] = useState("");
    const [username, setUsername] = useState("");

    const [leaveInputs, setLeaveInputs] = useState({});
    const [showLeaveInput, setShowLeaveInput] = useState({});
    const [leaveSubmitting, setLeaveSubmitting] = useState({});

    const [editingTaskIds, setEditingTaskIds] = useState(new Set()); // Multiple edit के लिए
    const [editedTaskDescriptions, setEditedTaskDescriptions] = useState({});

    const [uniqueDepartmentsFromTable, setUniqueDepartmentsFromTable] = useState(
        [],
    );

    // State for dropdowns
    const [dashboardType, setDashboardType] = useState("checklist");

    const [selectedRowsForDate, setSelectedRowsForDate] = useState(new Set());
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showDeleteButton, setShowDeleteButton] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [deleteMode, setDeleteMode] = useState(""); // "individual", "dateRange", or ""
    const [hasDateSelection, setHasDateSelection] = useState(false);

    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editedTaskDescription, setEditedTaskDescription] = useState("");

    const [savingTaskId, setSavingTaskId] = useState(null);
    const [saveLoading, setSaveLoading] = useState(false);

    const [totalRows, setTotalRows] = useState(0);
    const [dropdownRawData, setDropdownRawData] = useState([]);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // Debounce search term to prevent API spam
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const [selectedDepartment, setSelectedDepartment] =
        useState("Select Department");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 50;

    // ✅ Supabase: Task description update
    const handleSaveEdit = async (id, description) => {
        if (!description || !description.trim()) {
            alert("Task description empty nahi ho sakta");
            return;
        }

        const tableName = dashboardType === "delegation" ? "delegation" : "checklist";

        const { error } = await supabase
            .from(tableName)
            .update({ task_description: description.trim() })
            .eq("task_id", id);

        if (error) {
            alert("Update failed: " + error.message);
            return;
        }

        // ✅ UI update
        setAccountData((prev) =>
            prev.map((item) =>
                item._id === id ? { ...item, col5: description.trim() } : item,
            ),
        );
    };

    useEffect(() => {
        const role = localStorage.getItem("role");
        const user = localStorage.getItem("username");
        // const role = sessionStorage.getItem("role");
        // const user = sessionStorage.getItem("username");
        setUserRole(role || "");
        setUsername(user || "");
    }, []);

    // ✅ NEW: Filtered Names based on selected department
    const filteredMembersList = useMemo(() => {
        if (
            dashboardType === "delegation" &&
            selectedDepartment !== "Select Department"
        ) {
            const filtered = dropdownRawData.filter(
                (row) => row.department === selectedDepartment,
            );
            const membersSet = new Set();
            filtered.forEach((row) => {
                if (row.name && row.name.trim() !== "") {
                    membersSet.add(row.name);
                }
            });
            return Array.from(membersSet).sort();
        }
        return membersList;
    }, [dashboardType, selectedDepartment, dropdownRawData, membersList]);

    // ✅ NEW: Filtered Task Descriptions based on selected department
    const filteredTaskDescriptionList = useMemo(() => {
        if (
            dashboardType === "delegation" &&
            selectedDepartment !== "Select Department"
        ) {
            const filtered = dropdownRawData.filter(
                (row) => row.department === selectedDepartment,
            );
            const taskSet = new Set();
            filtered.forEach((row) => {
                if (row.task_description && row.task_description.trim() !== "") {
                    taskSet.add(row.task_description);
                }
            });
            return Array.from(taskSet).sort();
        }
        return taskDescriptionList;
    }, [dashboardType, selectedDepartment, dropdownRawData, taskDescriptionList]);

    // ✅ Select Options for react-select
    const departmentOptions = useMemo(() => {
        return ["Select Department", ...uniqueDepartmentsFromTable].map(d => ({ value: d, label: d }));
    }, [uniqueDepartmentsFromTable]);

    const nameOptions = useMemo(() => {
        return ["All Names", ...filteredMembersList].map(n => ({ value: n, label: n }));
    }, [filteredMembersList]);

    const taskOptions = useMemo(() => {
        return ["All Tasks", ...filteredTaskDescriptionList].map(t => ({
            value: t,
            label: t.length > 40 ? `${t.substring(0, 40)}...` : t
        }));
    }, [filteredTaskDescriptionList]);

    // ✅ Department change होने पर Name और Task Description reset करें
    useEffect(() => {
        if (dashboardType === "delegation") {
            setSelectedName("All Names");
            setSelectedTaskDescription("All Tasks");
        }
    }, [selectedDepartment, dashboardType]);

    // Reset pagination to page 1 when any filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [
        debouncedSearchTerm,
        selectedDepartment,
        selectedName,
        selectedTaskDescription,
        dashboardType
    ]);

    const totalPages = Math.ceil(totalRows / rowsPerPage);

    // ✅ Fetch just the dropdown items (runs once per dashboardType)
    const fetchDropdownData = useCallback(async () => {
        try {
            const tableName = dashboardType === "delegation" ? "delegation" : "checklist";

            const { count } = await supabase
                .from(tableName)
                .select('task_id', { count: 'exact', head: true });

            const pages = Math.ceil((count || 0) / 1000);
            const promises = [];
            for (let i = 0; i < pages; i++) {
                promises.push(
                    supabase
                        .from(tableName)
                        .select('department, name, task_description')
                        .range(i * 1000, (i + 1) * 1000 - 1)
                );
            }

            const results = await Promise.all(promises);
            let allRaw = [];
            const membersSet = new Set();
            const taskSet = new Set();
            const departmentSet = new Set();

            results.forEach(res => {
                (res.data || []).forEach(row => {
                    allRaw.push(row);
                    if (row.name) membersSet.add(row.name);
                    if (row.task_description) taskSet.add(row.task_description);
                    if (row.department) departmentSet.add(row.department);
                });
            });

            setDropdownRawData(allRaw);
            setMembersList([...membersSet].sort());
            setTaskDescriptionList([...taskSet].sort());
            setUniqueDepartmentsFromTable([...departmentSet].sort());
        } catch (error) {
            console.error("Dropdown fetch error", error);
        }
    }, [dashboardType]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    // ✅ Supabase: Fetch data from checklist or delegation table
    const fetchSheetData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const tableName = dashboardType === "delegation" ? "delegation" : "checklist";

            let query = supabase.from(tableName).select('*', { count: 'exact' });

            // Apply Filters Server-Side
            if (selectedDepartment !== "Select Department") {
                query = query.eq('department', selectedDepartment);
            }
            if (selectedName !== "All Names") {
                query = query.eq('name', selectedName);
            }
            if (selectedTaskDescription !== "All Tasks") {
                query = query.eq('task_description', selectedTaskDescription);
            }
            if (debouncedSearchTerm) {
                const term = `%${debouncedSearchTerm}%`;
                query = query.or(`department.ilike.${term},name.ilike.${term},task_description.ilike.${term},given_by.ilike.${term},status.ilike.${term}`);
            }

            // Pagination limits
            const startIndex = (currentPage - 1) * rowsPerPage;
            query = query
                .order("task_id", { ascending: true })
                .range(startIndex, startIndex + rowsPerPage - 1);

            const { data: rows, count, error: fetchError } = await query;

            if (fetchError) throw new Error(fetchError.message);

            setTotalRows(count || 0);

            const mapped = (rows || []).map((row, index) => {
                return {
                    // 🔑 Internal keys
                    _id: row.task_id,
                    _taskId: row.task_id,
                    _rowIndex: startIndex + index + 1,
                    _sheetName: tableName,

                    // 👇 UI EXPECTED colX FORMAT
                    col0: row.created_at,
                    col1: row.task_id,
                    col2: row.department,
                    col3: row.given_by,
                    col4: row.name,
                    col5: row.task_description,

                    // ISO → DD/MM/YYYY
                    col6: row.task_start_date
                        ? new Date(row.task_start_date).toLocaleDateString("en-GB")
                        : "",

                    col7: row.frequency,
                    col8: row.enable_reminder || "—",
                    col9: row.require_attachment || "—",

                    col10: row.submission_date
                        ? new Date(row.submission_date).toLocaleDateString("en-GB")
                        : "",

                    col11: row.delay,
                    col12: row.status,
                    col13: row.remark || row.remarks,
                    col14: row.image,
                    col15: row.admin_done,
                };
            });

            setAccountData(mapped);

            setLoading(false);
        } catch (err) {
            console.error("❌ Supabase Fetch error:", err);
            setError(err.message);
            setLoading(false);
        }
    }, [
        dashboardType,
        currentPage,
        selectedDepartment,
        selectedName,
        selectedTaskDescription,
        debouncedSearchTerm
    ]);

    useEffect(() => {
        fetchSheetData();
    }, [fetchSheetData]);



    const handleSelectItem = useCallback((id, isChecked) => {
        setSelectedItems((prev) => {
            const newSelected = new Set(prev);

            if (isChecked) {
                newSelected.add(id);
                // ✅ ALSO update selectedRowsForDate
                setSelectedRowsForDate((prevRows) => {
                    const newRows = new Set(prevRows);
                    newRows.add(id);
                    return newRows;
                });
            } else {
                newSelected.delete(id);
                // ✅ ALSO update selectedRowsForDate
                setSelectedRowsForDate((prevRows) => {
                    const newRows = new Set(prevRows);
                    newRows.delete(id);
                    return newRows;
                });

                // Clean up related data when unchecking
                setAdditionalData((prevData) => {
                    const newAdditionalData = { ...prevData };
                    delete newAdditionalData[id];
                    return newAdditionalData;
                });
                setRemarksData((prevRemarks) => {
                    const newRemarksData = { ...prevRemarks };
                    delete newRemarksData[id];
                    return newRemarksData;
                });
            }

            return newSelected;
        });
    }, []);

    const handleCheckboxClick = useCallback(
        (e, id) => {
            e.stopPropagation();
            handleSelectItem(id, e.target.checked);
        },
        [handleSelectItem],
    );


    const handleSelectAllItems = useCallback(
        (e) => {
            e.stopPropagation();
            const checked = e.target.checked;

            if (checked) {
                // ✅ ALL rows selected
                const allIds = new Set(accountData.map((item) => item._id));
                setSelectedItems(allIds);
                setSelectedRowsForDate(allIds); // ✅ ALSO update selectedRowsForDate
            } else {
                // ✅ ALL rows deselected
                setSelectedItems(new Set());
                setSelectedRowsForDate(new Set()); // ✅ ALSO update selectedRowsForDate
            }
        },
        [accountData],
    );

    // Existing state variables के बाद जोड़ें:
    const handleClearAllFilters = () => {
        // Clear all date filters
        setStartDate("");
        setEndDate("");
        setSelectedRowsForDate(new Set());

        // Clear search term
        setSearchTerm("");

        // Clear all dropdown selections
        setSelectedDepartment("Select Department");
        setSelectedName("All Names");
        setSelectedTaskDescription("All Tasks");

        // Clear checkbox selections
        setSelectedItems(new Set());

        // Clear edit mode if active
        setEditingTaskIds(new Set());
        setEditedTaskDescriptions({});

        // Reset delete mode
        setDeleteMode("");
        setShowDeleteButton(false);
    };


    const updateDeleteButtonState = useCallback(() => {
        // ✅ Check both conditions
        const hasSelectedRows = selectedRowsForDate.size > 0;
        const hasDateRange = startDate || endDate;
        const shouldEnable = hasSelectedRows || hasDateRange;

        setShowDeleteButton(shouldEnable);

        // Set delete mode based on what is selected
        if (hasSelectedRows && hasDateRange) {
            setDeleteMode("both"); // Both individual rows and date range
        } else if (hasSelectedRows) {
            setDeleteMode("individual");
        } else if (hasDateRange) {
            setDeleteMode("dateRange");
        } else {
            setDeleteMode("");
        }
    }, [selectedRowsForDate, startDate, endDate]);

    useEffect(() => {
        updateDeleteButtonState();
    }, [selectedRowsForDate, startDate, endDate, updateDeleteButtonState]);

    // ✅ Supabase: Delete selected rows
    const handleDeleteSelectedRows = async () => {
        if (selectedItems.size === 0) {
            alert("Select at least one row");
            return;
        }

        if (!window.confirm(`Delete ${selectedItems.size} selected task(s)?`))
            return;

        try {
            setDeleteLoading(true);

            const tableName = dashboardType === "delegation" ? "delegation" : "checklist";
            const idsToDelete = Array.from(selectedItems);

            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .in("task_id", idsToDelete);

            if (deleteError) {
                alert("Delete failed: " + deleteError.message);
                return;
            }

            // Update UI
            setAccountData((prev) =>
                prev.filter((item) => !selectedItems.has(item._id)),
            );

            const deletedCount = selectedItems.size;

            // Reset states
            setSelectedItems(new Set());
            setSelectedRowsForDate(new Set());

            alert(`${deletedCount} task(s) deleted successfully!`);
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete tasks. Please try again.");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col gap-3 w-full">
                            {/* ================= ROW 1: Search input – full width ================= */}
                            <div className="w-full sm:hidden">
                                <div className="relative w-full">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                        size={18}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search tasks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {/* ================= ROW 2: Dashboard | Department | Name | Task (Mobile only) ================= */}
                            <div className="flex flex-col gap-3 w-full sm:hidden">
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Dashboard */}
                                    <div className="w-full">
                                        <Select
                                            value={{ value: dashboardType, label: dashboardType === "delegation" ? "Delegation" : "Checklist" }}
                                            onChange={(selected) => {
                                                setDashboardType(selected.value);
                                                if (selected.value === "delegation") {
                                                    setSelectedDepartment("DELEGATION");
                                                } else {
                                                    setSelectedDepartment("Select Department");
                                                }
                                            }}
                                            options={[
                                                { value: "checklist", label: "Checklist" },
                                                { value: "delegation", label: "Delegation" }
                                            ]}
                                            styles={customStyles}
                                            placeholder="Dashboard"
                                            menuPlacement="auto"
                                            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                        />
                                    </div>

                                    {/* Department */}
                                    <div className="w-full">
                                        <Select
                                            value={{ value: selectedDepartment, label: selectedDepartment }}
                                            onChange={(selected) => setSelectedDepartment(selected.value)}
                                            options={departmentOptions}
                                            styles={customStyles}
                                            isSearchable={true}
                                            placeholder="Department"
                                            menuPlacement="auto"
                                            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                        />
                                    </div>

                                    {/* Name */}
                                    <div className="w-full">
                                        <Select
                                            value={{ value: selectedName, label: selectedName }}
                                            onChange={(selected) => setSelectedName(selected.value)}
                                            options={nameOptions}
                                            styles={customStyles}
                                            isSearchable={true}
                                            placeholder="Name"
                                            menuPlacement="auto"
                                            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                        />
                                    </div>

                                    {/* Task Description */}
                                    <div className="w-full col-span-2 mt-1">
                                        <Select
                                            value={{
                                                value: selectedTaskDescription,
                                                label: selectedTaskDescription.length > 40 ? `${selectedTaskDescription.substring(0, 40)}...` : selectedTaskDescription
                                            }}
                                            onChange={(selected) => setSelectedTaskDescription(selected.value)}
                                            options={taskOptions}
                                            styles={customStyles}
                                            isSearchable={true}
                                            placeholder="Task Description"
                                            menuPlacement="auto"
                                            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ================= ROW 3: Start Date | End Date (Mobile only) - IN ONE ROW ================= */}
                            {/* ================= MOBILE: Start Date | End Date ================= */}
                            <div className="flex flex-col gap-2 w-full sm:hidden">
                                {/* Row 1 → Start + End */}
                                <div className="flex gap-2 w-full">
                                    {/* Start Date */}
                                    <div className="flex flex-col w-1/2">
                                        <label className="text-[11px] font-medium text-gray-600 mb-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full text-xs rounded-md border border-purple-200 p-1.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div className="flex flex-col w-1/2">
                                        <label className="text-[11px] font-medium text-gray-600 mb-1">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full text-xs rounded-md border border-purple-200 p-1.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                {/* Row 2 → Clear Button */}
                                <button
                                    onClick={handleClearAllFilters}
                                    disabled={
                                        !startDate &&
                                        !endDate &&
                                        selectedRowsForDate.size === 0 &&
                                        searchTerm === "" &&
                                        selectedDepartment === "Select Department" &&
                                        selectedName === "All Names" &&
                                        selectedTaskDescription === "All Tasks" &&
                                        selectedItems.size === 0
                                    }
                                    className={`
      w-full h-8 text-xs font-semibold rounded-md
      flex items-center justify-center gap-2 transition-all
      ${!startDate &&
                                            !endDate &&
                                            selectedRowsForDate.size === 0 &&
                                            searchTerm === "" &&
                                            selectedDepartment === "Select Department" &&
                                            selectedName === "All Names" &&
                                            selectedTaskDescription === "All Tasks" &&
                                            selectedItems.size === 0
                                            ? "bg-red-300 text-white cursor-not-allowed"
                                            : "bg-red-600 text-white hover:bg-red-700"
                                        }
    `}
                                >
                                    <X className="h-3 w-3" />
                                    Clear All Filters
                                </button>
                            </div>

                            {/* ================= ROW 4: Delete | Update buttons (Mobile only) ================= */}
                            <div className="flex flex-col gap-3 w-full sm:hidden">
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    {showDeleteButton && (
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm text-blue-700 font-medium">
                                                {deleteMode === "individual" &&
                                                    selectedRowsForDate.size > 0
                                                    ? `${selectedRowsForDate.size} row(s) selected`
                                                    : deleteMode === "dateRange" && (startDate || endDate)
                                                        ? `Date range: ${startDate ? startDate.split("-").reverse().join("/") : "..."} to ${endDate ? endDate.split("-").reverse().join("/") : "..."}`
                                                        : deleteMode === "both"
                                                            ? `${selectedRowsForDate.size} rows in date range`
                                                            : "Ready to delete"}
                                            </div>

                                            <button
                                                onClick={handleDeleteSelectedRows}
                                                disabled={deleteLoading}
                                                className={`
        h-9 px-5 text-sm font-semibold rounded-lg
        flex items-center gap-2 transition-all
        shadow-sm min-w-[120px] justify-center
        ${deleteLoading
                                                        ? "bg-red-400 cursor-not-allowed"
                                                        : "bg-red-500 hover:bg-red-600 text-white hover:shadow-md"
                                                    }
      `}
                                            >
                                                {deleteLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <X className="h-4 w-4" />
                                                        Delete{" "}
                                                        {deleteMode === "individual" &&
                                                            selectedRowsForDate.size > 0
                                                            ? `(${selectedRowsForDate.size})`
                                                            : deleteMode === "dateRange"
                                                                ? "(Range)"
                                                                : deleteMode === "both"
                                                                    ? `(${selectedRowsForDate.size})`
                                                                    : ""}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {editingTaskIds.size > 0 && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    setSaveLoading(true);
                                                    const updates = [];

                                                    for (const taskId of editingTaskIds) {
                                                        const task = accountData.find(
                                                            (item) => item._id === taskId,
                                                        );
                                                        if (task && editedTaskDescriptions[taskId]) {
                                                            updates.push(
                                                                handleSaveEdit(
                                                                    taskId,
                                                                    editedTaskDescriptions[taskId],
                                                                ),
                                                            );
                                                        }
                                                    }

                                                    await Promise.all(updates);
                                                    setEditingTaskIds(new Set());
                                                    setEditedTaskDescriptions({});
                                                    alert(
                                                        `${updates.length} task(s) updated successfully!`,
                                                    );
                                                } catch (error) {
                                                    console.error("Error updating tasks:", error);
                                                    alert(
                                                        "Some tasks failed to update. Please try again.",
                                                    );
                                                } finally {
                                                    setSaveLoading(false);
                                                }
                                            }}
                                            disabled={saveLoading}
                                            className={`
              w-full h-9 px-5 text-sm font-semibold rounded-lg
              flex items-center justify-center gap-2 transition-all
              shadow-sm
              ${saveLoading
                                                    ? "bg-green-400 cursor-not-allowed"
                                                    : "bg-green-500 hover:bg-green-600 text-white hover:shadow-md"
                                                }
            `}
                                        >
                                            {saveLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Update All ({editingTaskIds.size})
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ================= DESKTOP LAYOUT (Exactly as before - NO CHANGES) ================= */}
                            <div className="hidden sm:flex flex-col sm:flex-row gap-3 w-full">
                                {/* Search → takes remaining width */}
                                <div className="relative w-full sm:flex-1">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                        size={18}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search tasks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <Select
                                    value={{ value: dashboardType, label: dashboardType === "delegation" ? "Delegation" : "Checklist" }}
                                    onChange={(selected) => {
                                        setDashboardType(selected.value);
                                        if (selected.value === "delegation") {
                                            setSelectedDepartment("DELEGATION");
                                        } else {
                                            setSelectedDepartment("Select Department");
                                        }
                                    }}
                                    options={[
                                        { value: "checklist", label: "Checklist" },
                                        { value: "delegation", label: "Delegation" }
                                    ]}
                                    styles={customStyles}
                                    placeholder="Dashboard"
                                    menuPlacement="auto"
                                    className="min-w-[140px]"
                                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                />

                                {/* Department */}
                                <div className="w-full sm:w-[180px] z-10">
                                    <Select
                                        value={{ value: selectedDepartment, label: selectedDepartment }}
                                        onChange={(selected) => setSelectedDepartment(selected.value)}
                                        options={departmentOptions}
                                        styles={customStyles}
                                        isSearchable={true}
                                        placeholder="Department"
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                    />
                                </div>

                                {/* Name */}
                                <div className="w-full sm:w-[180px] z-10">
                                    <Select
                                        value={{ value: selectedName, label: selectedName }}
                                        onChange={(selected) => setSelectedName(selected.value)}
                                        options={nameOptions}
                                        styles={customStyles}
                                        isSearchable={true}
                                        placeholder="Name"
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                    />
                                </div>

                                {/* Task Description */}
                                <div className="w-full sm:w-[240px] z-10">
                                    <Select
                                        value={{
                                            value: selectedTaskDescription,
                                            label: selectedTaskDescription.length > 40 ? `${selectedTaskDescription.substring(0, 40)}...` : selectedTaskDescription
                                        }}
                                        onChange={(selected) => setSelectedTaskDescription(selected.value)}
                                        options={taskOptions}
                                        styles={customStyles}
                                        isSearchable={true}
                                        placeholder="Task Description"
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                    />
                                </div>
                            </div>

                            {/* ================= DESKTOP: Row 2 (Start Date, End Date, Buttons) ================= */}
                            <div className="hidden sm:flex flex-col sm:flex-row gap-3 sm:items-center">
                                {/* Start Date */}
                                <div className="flex items-center gap-2 w-full sm:w-[220px]">
                                    <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="flex-1 rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>

                                {/* End Date */}
                                <div className="flex items-center gap-2 w-full sm:w-[220px]">
                                    <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="flex-1 rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>

                                <button
                                    onClick={handleClearAllFilters}
                                    disabled={
                                        !startDate &&
                                        !endDate &&
                                        selectedRowsForDate.size === 0 &&
                                        searchTerm === "" &&
                                        selectedDepartment === "Select Department" &&
                                        selectedName === "All Names" &&
                                        selectedTaskDescription === "All Tasks" &&
                                        selectedItems.size === 0
                                    }
                                    className={`
  h-9 px-4 text-sm font-semibold rounded-md
  flex items-center gap-2 transition-all min-w-[140px] justify-center
  ${!startDate &&
                                            !endDate &&
                                            selectedRowsForDate.size === 0 &&
                                            searchTerm === "" &&
                                            selectedDepartment === "Select Department" &&
                                            selectedName === "All Names" &&
                                            selectedTaskDescription === "All Tasks" &&
                                            selectedItems.size === 0
                                            ? "bg-red-300 text-white cursor-not-allowed"
                                            : "bg-red-600 text-white hover:bg-red-700 border border-red-700 hover:shadow-sm"
                                        }
`}
                                >
                                    <X className="h-4 w-4" />
                                    Clear All Filters
                                </button>

                                {showDeleteButton && (
                                    <div className="flex items-center gap-3 ml-auto">
                                        <div className="text-sm text-blue-700 font-medium">
                                            {deleteMode === "individual" &&
                                                selectedRowsForDate.size > 0
                                                ? `${selectedRowsForDate.size} row(s) selected`
                                                : deleteMode === "dateRange" && (startDate || endDate)
                                                    ? `Date range: ${startDate ? startDate.split("-").reverse().join("/") : "..."} to ${endDate ? endDate.split("-").reverse().join("/") : "..."}`
                                                    : "Ready to delete"}
                                        </div>

                                        <button
                                            onClick={handleDeleteSelectedRows}
                                            disabled={deleteLoading}
                                            className={`
              h-9 px-5 text-sm font-semibold rounded-lg
              flex items-center gap-2 transition-all
              shadow-sm min-w-[120px] justify-center
              ${deleteLoading
                                                    ? "bg-red-400 cursor-not-allowed"
                                                    : "bg-red-500 hover:bg-red-600 text-white hover:shadow-md"
                                                }
            `}
                                        >
                                            {deleteLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <X className="h-4 w-4" />
                                                    Delete{" "}
                                                    {deleteMode === "individual" &&
                                                        selectedRowsForDate.size > 0
                                                        ? `(${selectedRowsForDate.size})`
                                                        : deleteMode === "dateRange"
                                                            ? "(Range)"
                                                            : ""}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {editingTaskIds.size > 0 && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                setSaveLoading(true);
                                                const updates = [];

                                                for (const taskId of editingTaskIds) {
                                                    const task = accountData.find(
                                                        (item) => item._id === taskId,
                                                    );
                                                    if (task && editedTaskDescriptions[taskId]) {
                                                        updates.push(
                                                            handleSaveEdit(
                                                                taskId,
                                                                editedTaskDescriptions[taskId],
                                                            ),
                                                        );
                                                    }
                                                }

                                                await Promise.all(updates);
                                                setEditingTaskIds(new Set());
                                                setEditedTaskDescriptions({});
                                                alert(
                                                    `${updates.length} task(s) updated successfully!`,
                                                );
                                            } catch (error) {
                                                console.error("Error updating tasks:", error);
                                                alert("Some tasks failed to update. Please try again.");
                                            } finally {
                                                setSaveLoading(false);
                                            }
                                        }}
                                        disabled={saveLoading}
                                        className={`
            h-9 px-5 text-sm font-semibold rounded-lg
            flex items-center gap-2 transition-all
            shadow-sm min-w-[120px] justify-center
            ${saveLoading
                                                ? "bg-green-400 cursor-not-allowed"
                                                : "bg-green-500 hover:bg-green-600 text-white hover:shadow-md"
                                            }
          `}
                                    >
                                        {saveLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Update All ({editingTaskIds.size})
                                            </>
                                        )}
                                    </button>
                                )}
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
                </div>


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
                            {/* Desktop View - Table */}
                            <div className="hidden md:block overflow-x-auto max-h-[370px]">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-blue-200 sticky top-0 z-30">
                                        <tr>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                        checked={
                                                            accountData.length > 0 &&
                                                            selectedItems.size === accountData.length
                                                        }
                                                        onChange={handleSelectAllItems}
                                                    />
                                                    <span>Delete</span>
                                                </div>
                                            </th>

                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={
                                                            accountData.length > 0 &&
                                                            accountData.every((account) =>
                                                                editingTaskIds.has(account._id),
                                                            )
                                                        }
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            if (checked) {
                                                                const allIds = new Set(
                                                                    accountData.map((item) => item._id),
                                                                );
                                                                setEditingTaskIds(allIds);

                                                                const descriptions = {};
                                                                accountData.forEach((account) => {
                                                                    descriptions[account._id] =
                                                                        account["col5"] || "";
                                                                });
                                                                setEditedTaskDescriptions(descriptions);

                                                                setSelectedItems(new Set());
                                                            } else {
                                                                setEditingTaskIds(new Set());
                                                                setEditedTaskDescriptions({});
                                                            }
                                                        }}
                                                    />
                                                    <span>Edit</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-center whitespace-nowrap text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Task ID
                                            </th>
                                            <th className="px-6 py-3 text-center whitespace-nowrap text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                {dashboardType === "delegation"
                                                    ? "Department"
                                                    : "Department Name"}
                                            </th>
                                            <th className="px-6 py-3 text-center whitespace-nowrap text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Given By
                                            </th>
                                            <th className="px-6 py-3 text-center whitespace-nowrap text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-center whitespace-nowrap text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Task Description
                                            </th>
                                            <th className="px-6 py-3 text-center whitespace-nowrap text-xs font-medium text-gray-500 uppercase7tracking-wider bg-yellow-50">
                                                Task Start Date
                                            </th>
                                            <th className="px-6 py-3 text-center whitespace-nowrap text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Freq
                                            </th>
                                            <th className="px-6 py-3 text-center whitespace-nowrap text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Enable Reminders
                                            </th>
                                            <th className="px-6 py-3 text-center whitespace-nowrap text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Require Attachment
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {accountData.length > 0 ? (
                                            accountData.map((account) => {
                                                const isSelected = selectedItems.has(account._id);
                                                const isEditing = editingTaskIds.has(account._id);
                                                return (
                                                    <tr
                                                        key={account._id}
                                                        className={`${isSelected ? "bg-purple-50" : ""} hover:bg-gray-50`}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                                checked={isSelected}
                                                                onChange={(e) =>
                                                                    handleCheckboxClick(e, account._id)
                                                                }
                                                                disabled={showLeaveInput[account._id]}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap bg-orange-50">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                    checked={editingTaskIds.has(account._id)}
                                                                    onChange={(e) => {
                                                                        const shouldEdit = e.target.checked;
                                                                        if (shouldEdit) {
                                                                            setEditingTaskIds((prev) => {
                                                                                const newSet = new Set(prev);
                                                                                newSet.add(account._id);
                                                                                return newSet;
                                                                            });

                                                                            setEditedTaskDescriptions((prev) => ({
                                                                                ...prev,
                                                                                [account._id]: account["col5"] || "",
                                                                            }));

                                                                            setSelectedItems((prev) => {
                                                                                const newSelected = new Set(prev);
                                                                                newSelected.delete(account._id);
                                                                                return newSelected;
                                                                            });
                                                                        } else {
                                                                            setEditingTaskIds((prev) => {
                                                                                const newSet = new Set(prev);
                                                                                newSet.delete(account._id);
                                                                                return newSet;
                                                                            });

                                                                            setEditedTaskDescriptions((prev) => {
                                                                                const newObj = { ...prev };
                                                                                delete newObj[account._id];
                                                                                return newObj;
                                                                            });
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-sm text-gray-700">
                                                                    Edit
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="text-sm text-gray-900">
                                                                {account["col1"] || "—"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="text-sm text-gray-900">
                                                                {account["col2"] || "—"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="text-sm text-gray-900">
                                                                {account["col3"] || "—"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="text-sm text-gray-900">
                                                                {account["col4"] || "—"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {editingTaskIds.has(account._id) ? (
                                                                <div className="space-y-2">
                                                                    <textarea
                                                                        value={
                                                                            editedTaskDescriptions[account._id] || ""
                                                                        }
                                                                        onChange={(e) => {
                                                                            setEditedTaskDescriptions((prev) => ({
                                                                                ...prev,
                                                                                [account._id]: e.target.value,
                                                                            }));
                                                                        }}
                                                                        className="w-full min-w-[350px] px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                        rows="3"
                                                                        autoFocus
                                                                    />
                                                                    <div className="text-xs text-gray-500">
                                                                        Unchecking the checkbox will turn off edit
                                                                        mode
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className="text-sm text-gray-900 text-center max-w-xs truncate"
                                                                    title={account["col5"]}
                                                                >
                                                                    {account["col5"] || "—"}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center bg-yellow-50">
                                                            <div className="text-sm text-gray-900">
                                                                {account["col6"] || "—"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {account["col7"] || "—"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="text-sm text-gray-900">
                                                                {account["col8"] || "—"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="text-sm text-gray-900">
                                                                {account["col9"] || "—"}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={14}
                                                    className="px-6 py-4 text-center text-gray-500"
                                                >
                                                    {searchTerm
                                                        ? "No tasks matching your search"
                                                        : "No pending tasks found for today, tomorrow, or past due dates"}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View - Cards */}
                            <div className="md:hidden">
                                {accountData.length > 0 ? (
                                    <div className="space-y-4 p-4">
                                        {accountData.map((account) => {
                                            const isSelected = selectedItems.has(account._id);
                                            const isEditing = editingTaskIds.has(account._id);

                                            return (
                                                <div
                                                    key={account._id}
                                                    className={`border border-gray-200 rounded-lg shadow-sm p-4 ${isSelected
                                                        ? "bg-purple-50 border-purple-300"
                                                        : "bg-white"
                                                        }`}
                                                >
                                                    {/* Header with checkboxes */}
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                                checked={isSelected}
                                                                onChange={(e) =>
                                                                    handleCheckboxClick(e, account._id)
                                                                }
                                                                disabled={showLeaveInput[account._id]}
                                                            />
                                                            <span className="text-sm font-medium text-gray-700">
                                                                Delete
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                checked={isEditing}
                                                                onChange={(e) => {
                                                                    const shouldEdit = e.target.checked;
                                                                    if (shouldEdit) {
                                                                        setEditingTaskIds((prev) => {
                                                                            const newSet = new Set(prev);
                                                                            newSet.add(account._id);
                                                                            return newSet;
                                                                        });

                                                                        setEditedTaskDescriptions((prev) => ({
                                                                            ...prev,
                                                                            [account._id]: account["col5"] || "",
                                                                        }));

                                                                        setSelectedItems((prev) => {
                                                                            const newSelected = new Set(prev);
                                                                            newSelected.delete(account._id);
                                                                            return newSelected;
                                                                        });
                                                                    } else {
                                                                        setEditingTaskIds((prev) => {
                                                                            const newSet = new Set(prev);
                                                                            newSet.delete(account._id);
                                                                            return newSet;
                                                                        });

                                                                        setEditedTaskDescriptions((prev) => {
                                                                            const newObj = { ...prev };
                                                                            delete newObj[account._id];
                                                                            return newObj;
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-sm font-medium text-blue-700">
                                                                Edit
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Task Details */}
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <p className="text-xs text-gray-500">Task ID</p>
                                                                <p className="text-sm font-medium">
                                                                    {account["col1"] || "—"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">
                                                                    {dashboardType === "delegation"
                                                                        ? "Department"
                                                                        : "Department Name"}
                                                                </p>
                                                                <p className="text-sm font-medium">
                                                                    {account["col2"] || "—"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">
                                                                    Given By
                                                                </p>
                                                                <p className="text-sm font-medium">
                                                                    {account["col3"] || "—"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Name</p>
                                                                <p className="text-sm font-medium">
                                                                    {account["col4"] || "—"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Task Description - Full width */}
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">
                                                                Task Description
                                                            </p>
                                                            {isEditing ? (
                                                                <div className="space-y-2">
                                                                    <textarea
                                                                        value={
                                                                            editedTaskDescriptions[account._id] || ""
                                                                        }
                                                                        onChange={(e) => {
                                                                            setEditedTaskDescriptions((prev) => ({
                                                                                ...prev,
                                                                                [account._id]: e.target.value,
                                                                            }));
                                                                        }}
                                                                        className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                        rows="3"
                                                                        autoFocus
                                                                    />
                                                                    <div className="text-xs text-gray-500">
                                                                        Uncheck Edit to save changes
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-900">
                                                                    {account["col5"] || "—"}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Bottom row details */}
                                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                                            <div className="bg-yellow-50 p-2 rounded">
                                                                <p className="text-xs text-gray-500">
                                                                    Task Start Date
                                                                </p>
                                                                <p className="text-sm font-medium">
                                                                    {account["col6"] || "—"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">
                                                                    Frequency
                                                                </p>
                                                                <p className="text-sm font-medium">
                                                                    {account["col7"] || "—"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">
                                                                    Enable Reminders
                                                                </p>
                                                                <p className="text-sm font-medium">
                                                                    {account["col8"] || "—"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">
                                                                    Require Attachment
                                                                </p>
                                                                <p className="text-sm font-medium">
                                                                    {account["col9"] || "—"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 px-4">
                                        <p className="text-gray-500">
                                            {searchTerm
                                                ? "No tasks matching your search"
                                                : "No pending tasks found for today, tomorrow, or past due dates"}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                                <div className="flex justify-between sm:hidden w-full">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{accountData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * rowsPerPage, totalRows)}</span> of <span className="font-medium">{totalRows}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                            >
                                                <span className="sr-only">Previous</span>
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                                </svg>
                                            </button>

                                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                                Page {currentPage} of {totalPages || 1}
                                            </span>

                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages || totalPages === 0}
                                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                            >
                                                <span className="sr-only">Next</span>
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

export default AccountDataPage;
