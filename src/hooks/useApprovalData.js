import { useCallback, useEffect, useMemo } from 'react';
import supabase from '../SupabaseClient';
import useApprovalStore from '../store/useApprovalStore';
import { useDispatch } from 'react-redux';
import { checklistHistoryData } from '../redux/slice/checklistSlice';
import { fetchChechListDataForHistory } from '../redux/api/checkListApi';

export const useApprovalData = () => {
    // Access state and setters from store
    const {
        activeApprovalTab,
        searchTerm,
        selectedMembers,
        startDate,
        endDate,
        historyData,
        delegationHistoryData,
        editedAdminStatus,
        savingEdits,
        selectedHistoryItems,
        markingAsDone,
        setLoading,
        setIsLoadingMore,
        setError,
        setSuccessMessage,
        setHistoryData,
        setDelegationHistoryData,
        setMembersList,
        setEditingRows,
        setEditedAdminStatus,
        setSavingEdits,
        setSelectedHistoryItems,
        setMarkingAsDone,
        setConfirmationModal,
        checklistPage,
        setChecklistPage,
        hasMoreChecklist,
        setHasMoreChecklist,
        delegationPage,
        setDelegationPage,
        hasMoreDelegation,
        setHasMoreDelegation,
        totalChecklistCount,
        setTotalChecklistCount,
        totalDelegationCount,
        setTotalDelegationCount,
        totalAdminDoneChecklist,
        setTotalAdminDoneChecklist,
        totalAdminDoneDelegation,
        setTotalAdminDoneDelegation
    } = useApprovalStore();

    const dispatch = useDispatch();

    const userRole = localStorage.getItem("role");
    const username = localStorage.getItem("user-name");

    // --- Helpers ---

    // Format date-time to DD/MM/YYYY HH:MM:SS
    const formatDateTimeToDDMMYYYY = (date) => {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    const parseDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return "";
        if (typeof dateTimeStr === "string" && dateTimeStr.includes("T")) {
            const date = new Date(dateTimeStr);
            return formatDateTimeToDDMMYYYY(date);
        }
        if (typeof dateTimeStr === "string" && dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) {
            return dateTimeStr;
        }
        if (typeof dateTimeStr === "string" && dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            return dateTimeStr;
        }
        return dateTimeStr;
    };

    const parseDateFromDDMMYYYY = (dateStr) => {
        if (!dateStr || typeof dateStr !== "string") return null;
        const datePart = dateStr.includes(" ") ? dateStr.split(" ")[0] : dateStr;
        const parts = datePart.split("/");
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[1] - 1, parts[0]);
    };

    // --- Data Fetching ---

    const fetchSheetData = useCallback(async () => {
        try {
            setLoading(true);
            const currentUsername = localStorage.getItem("user-name");
            const currentUserRole = localStorage.getItem("role");

            // Fetch Checklist data - INITIAL PAGE + COUNT
            const itemsPerPage = 100;
            const { data: checklistData, error: checklistError, count: checklistCount } = await supabase
                .from('checklist')
                .select('*', { count: 'exact' })
                .not('submission_date', 'is', null)
                .not('status', 'is', null)
                .order('task_start_date', { ascending: false })
                .range(0, itemsPerPage - 1);

            if (checklistError) throw new Error(`Failed to fetch checklist data: ${checklistError.message}`);

            // Fetch Playlist of all users for the dropdown filter from Supabase
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('user_name')
                .order('user_name', { ascending: true });

            let finalMembersList = [];
            if (!userError && userData) {
                finalMembersList = [...new Set(userData.map(u => u.user_name))].filter(Boolean);
            }

            // Fetch Checklist ADMIN DONE COUNT (Grand total from DB)
            const { count: adminDoneChecklistCount } = await supabase
                .from('checklist')
                .select('task_id', { count: 'exact', head: true })
                .not('submission_date', 'is', null)
                .not('status', 'is', null)
                .ilike('admin_done', 'Done');

            // Fetch Delegation data - INITIAL PAGE + COUNT
            const { data: delegationData, error: delegationError, count: delegationCount } = await supabase
                .from('delegation')
                .select('*', { count: 'exact' })
                .not('submission_date', 'is', null)
                .not('status', 'is', null)
                .order('task_start_date', { ascending: false })
                .range(0, itemsPerPage - 1);

            // Fetch Delegation ADMIN DONE COUNT (Grand total from DB)
            const { count: adminDoneDelegationCount } = await supabase
                .from('delegation')
                .select('task_id', { count: 'exact', head: true })
                .not('submission_date', 'is', null)
                .not('status', 'is', null)
                .ilike('admin_done', 'Done');


            // Process Checklist data
            const processedChecklistData = checklistData.map((row, index) => {
                const assignedTo = row.name || "Unassigned";

                const taskId = row.task_id || "";
                const stableId = taskId
                    ? `checklist_task_${taskId}_${index + 1}`
                    : `checklist_row_${index + 1}_${Math.random().toString(36).substring(2, 15)}`;

                return {
                    _id: stableId,
                    _rowIndex: index + 1,
                    _taskId: taskId,
                    _sheetType: 'checklist',
                    task_id: row.task_id,
                    task_description: row.task_description,
                    name: row.name,
                    given_by: row.given_by,
                    department: row.department,
                    task_start_date: parseDateTime(row.task_start_date),
                    planned_date: parseDateTime(row.planned_date),
                    frequency: row.frequency,
                    enable_reminders: row.enable_reminders,
                    require_attachment: row.require_attachment,
                    submission_date: parseDateTime(row.submission_date),
                    status: row.status,
                    remark: row.remark,
                    image: row.image,
                    admin_done: row.admin_done,
                };
            });

            // Process Delegation data
            const processedDelegationData = delegationData.map((row, index) => {
                const assignedTo = row.name || "Unassigned";

                const taskId = row.task_id || "";
                const stableId = taskId
                    ? `delegation_task_${taskId}_${index + 1}`
                    : `delegation_row_${index + 1}_${Math.random().toString(36).substring(2, 15)}`;

                return {
                    _id: stableId,
                    _rowIndex: index + 1,
                    _taskId: taskId,
                    _sheetType: 'delegation',
                    task_id: row.task_id,
                    task_description: row.task_description,
                    name: row.name,
                    given_by: row.given_by,
                    department: row.department,
                    task_start_date: parseDateTime(row.task_start_date),
                    planned_date: parseDateTime(row.planned_date),
                    frequency: row.frequency || row.freq,
                    enable_reminders: row.enable_reminder || row.enable_reminders,
                    require_attachment: row.require_attachment,
                    submission_date: parseDateTime(row.submission_date),
                    status: row.status,
                    remark: row.remarks || row.remark,
                    image: row.image || "",
                    admin_done: row.admin_done || "",
                };
            });

            setMembersList(finalMembersList);
            setHistoryData(processedChecklistData);
            setDelegationHistoryData(processedDelegationData);

            // Set pagination states for page 1
            setChecklistPage(1);
            setDelegationPage(1);
            setHasMoreChecklist(processedChecklistData.length === 100);
            setHasMoreDelegation(processedDelegationData.length === 100);

            // Set grand totals
            setTotalChecklistCount(checklistCount || 0);
            setTotalDelegationCount(delegationCount || 0);
            setTotalAdminDoneChecklist(adminDoneChecklistCount || 0);
            setTotalAdminDoneDelegation(adminDoneDelegationCount || 0);

            setLoading(false);
        } catch (error) {
            console.error("Error fetching sheet data:", error);
            setError("Failed to load account data: " + error.message);
            setLoading(false);
        }
    }, [setError, setHistoryData, setDelegationHistoryData, setMembersList, setLoading, setChecklistPage, setDelegationPage, setHasMoreChecklist, setHasMoreDelegation]);

    // NEW: Fetch more data handler for pagination
    const fetchMoreData = useCallback(async () => {
        try {
            const itemsPerPage = 100;
            if (activeApprovalTab === 'checklist') {
                if (!hasMoreChecklist) return;
                setIsLoadingMore(true);
                const nextPage = checklistPage + 1;

                let query = supabase
                    .from('checklist')
                    .select('*')
                    .not('submission_date', 'is', null)
                    .not('status', 'is', null);
                
                // Add search logic back to pagination
                if (searchTerm) {
                    query = query.or(`task_id.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,given_by.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%,task_description.ilike.%${searchTerm}%`);
                }

                const start = (nextPage - 1) * itemsPerPage;
                const { data, error } = await query
                    .order('task_start_date', { ascending: false })
                    .range(start, start + itemsPerPage - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    const processed = data.map((row, index) => {
                        const taskId = row.task_id || "";
                        return {
                            _id: `checklist_task_${taskId}_${nextPage}_${index}`,
                            _sheetType: 'checklist',
                            ...row,
                            task_start_date: parseDateTime(row.task_start_date),
                            submission_date: parseDateTime(row.submission_date),
                        };
                    });

                    setHistoryData(prev => [...prev, ...processed]);
                    setChecklistPage(nextPage);
                    setHasMoreChecklist(data.length === itemsPerPage);
                } else {
                    setHasMoreChecklist(false);
                }
            } else {
                if (!hasMoreDelegation) return;
                setIsLoadingMore(true);
                const nextPage = delegationPage + 1;

                let query = supabase
                    .from('delegation')
                    .select('*')
                    .not('submission_date', 'is', null)
                    .not('status', 'is', null);
                
                // Add search logic back to pagination
                if (searchTerm) {
                    query = query.or(`task_id.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,given_by.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%,task_description.ilike.%${searchTerm}%`);
                }

                const start = (nextPage - 1) * itemsPerPage;
                const { data, error } = await query
                    .order('task_start_date', { ascending: false })
                    .range(start, start + itemsPerPage - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    const processed = data.map((row, index) => {
                        const taskId = row.task_id || "";
                        return {
                            _id: `delegation_task_${taskId}_${nextPage}_${index}`,
                            _sheetType: 'delegation',
                            ...row,
                            task_start_date: parseDateTime(row.task_start_date),
                            submission_date: parseDateTime(row.submission_date),
                        };
                    });

                    setDelegationHistoryData(prev => [...prev, ...processed]);
                    setDelegationPage(nextPage);
                    setHasMoreDelegation(data.length === itemsPerPage);
                } else {
                    setHasMoreDelegation(false);
                }
            }
        } catch (err) {
            console.error("Error loading more data:", err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [activeApprovalTab, checklistPage, hasMoreChecklist, delegationPage, hasMoreDelegation, setHistoryData, setDelegationHistoryData, setChecklistPage, setDelegationPage, setHasMoreChecklist, setHasMoreDelegation, setIsLoadingMore]);

    // Initial Fetch
    useEffect(() => {
        fetchSheetData();
    }, [fetchSheetData]);


    // --- Logic & Actions ---

    const handleEditClick = (historyItem) => {
        const rowId = historyItem._id;
        setEditingRows((prev) => {
            const newSet = new Set(prev);
            newSet.add(rowId);
            return newSet
        });
        setEditedAdminStatus((prev) => ({
            ...prev,
            [rowId]: historyItem.admin_done || "",
        }));
    };

    const handleCancelEdit = (rowId) => {
        setEditingRows((prev) => {
            const newSet = new Set(prev);
            newSet.delete(rowId);
            return newSet;
        });
        setEditedAdminStatus((prev) => {
            const newStatus = { ...prev };
            delete newStatus[rowId];
            return newStatus;
        });
    };

    const handleSaveEdit = async (historyItem) => {
        const rowId = historyItem._id;
        const newStatus = editedAdminStatus[rowId];
        const sheetType = historyItem._sheetType || 'checklist';
        const targetTable = sheetType === 'delegation' ? 'delegation' : 'checklist';
        const taskId = historyItem._taskId || historyItem.task_id;

        if (savingEdits.has(rowId)) return;

        setSavingEdits((prev) => {
            const newSet = new Set(prev);
            newSet.add(rowId);
            return newSet;
        });

        try {
            const statusToSend = newStatus === "" || newStatus === undefined ? "" : newStatus;

            const { error } = await supabase
                .from(targetTable)
                .update({ admin_done: statusToSend })
                .eq('task_id', taskId);

            if (error) throw new Error(error.message);

            const updatedStatus = newStatus === "" || newStatus === undefined ? "" : newStatus;

            if (sheetType === 'delegation') {
                setDelegationHistoryData((prev) =>
                    prev.map((item) =>
                        item._id === rowId ? { ...item, admin_done: updatedStatus } : item
                    )
                );
            } else {
                setHistoryData((prev) =>
                    prev.map((item) =>
                        item._id === rowId ? { ...item, admin_done: updatedStatus } : item
                    )
                );
            }

            setEditingRows((prev) => {
                const newSet = new Set(prev);
                newSet.delete(rowId);
                return newSet;
            });

            setEditedAdminStatus((prev) => {
                const newStatusObj = { ...prev };
                delete newStatusObj[rowId];
                return newStatusObj;
            });

            setSuccessMessage("Admin status updated successfully!");
            setTimeout(() => { fetchSheetData(); }, 3000);

        } catch (error) {
            console.error("Error updating Admin status:", error);
            setSuccessMessage(`Failed to update Admin status: ${error.message}`);
        } finally {
            setSavingEdits((prev) => {
                const newSet = new Set(prev);
                newSet.delete(rowId);
                return newSet;
            });
        }
    };

    const handleMarkMultipleDone = () => {
        if (selectedHistoryItems.length === 0) return;
        if (markingAsDone) return;
        setConfirmationModal({
            isOpen: true,
            itemCount: selectedHistoryItems.length,
        });
    };

    const confirmMarkDone = async () => {
        setConfirmationModal({ isOpen: false, itemCount: 0 });
        setMarkingAsDone(true);

        try {
            const checklistItems = selectedHistoryItems.filter(item => item._sheetType === 'checklist');
            const delegationItems = selectedHistoryItems.filter(item => item._sheetType === 'delegation');

            if (checklistItems.length > 0) {
                const checklistTaskIds = checklistItems.map(item => item._taskId || item.task_id);
                const { error } = await supabase
                    .from('checklist')
                    .update({ admin_done: "Done" })
                    .in('task_id', checklistTaskIds);
                if (error) throw new Error(error.message);
            }

            if (delegationItems.length > 0) {
                const delegationTaskIds = delegationItems.map(item => item._taskId || item.task_id);
                const { error } = await supabase
                    .from('delegation')
                    .update({ admin_done: "Done" })
                    .in('task_id', delegationTaskIds);
                if (error) throw new Error(error.message);
            }

            // Client-side update
            setHistoryData((prev) => prev.filter(item => !selectedHistoryItems.some(selected => selected._id === item._id)));
            setDelegationHistoryData((prev) => prev.filter(item => !selectedHistoryItems.some(selected => selected._id === item._id)));

            setSelectedHistoryItems([]);
            setSuccessMessage(`Successfully marked ${selectedHistoryItems.length} items as Admin Done!`);
            setTimeout(() => { fetchSheetData(); }, 2000);

        } catch (error) {
            console.error("Error marking tasks as Admin Done:", error);
            setSuccessMessage(`Failed to mark tasks as Admin Done: ${error.message}`);
        } finally {
            setMarkingAsDone(false);
        }
    };

    // --- Computed Data ---
    const filterData = (data) => {
        return data
            .filter((item) => {
                const matchesSearch = searchTerm
                    ? Object.entries(item).some(([key, value]) => {
                        if (['image', 'admin_done'].includes(key)) return false;
                        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    : true;
                const matchesMember = selectedMembers.length > 0 ? selectedMembers.includes(item.name) : true;

                let matchesDateRange = true;
                if (startDate || endDate) {
                    // Match SalesDataPage logic - use task_start_date for range filtering
                    const itemDate = new Date(item.task_start_date);
                    if (!itemDate || isNaN(itemDate.getTime())) return false;

                    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
                    const start = startDate ? new Date(startDate) : null;
                    if (start) start.setHours(0, 0, 0, 0);

                    const end = endDate ? new Date(endDate) : null;
                    if (end) end.setHours(23, 59, 59, 999);

                    if (start && itemDateOnly < start) matchesDateRange = false;
                    if (end && itemDateOnly > end) matchesDateRange = false;
                }
                return matchesSearch && matchesMember && matchesDateRange;
            })
            .sort((a, b) => {
                // Match SalesDataPage sorting - newest first by start date
                const dateA = new Date(a.task_start_date);
                const dateB = new Date(b.task_start_date);
                if (!dateA || isNaN(dateA.getTime())) return 1;
                if (!dateB || isNaN(dateB.getTime())) return -1;
                return dateB - dateA;
            });
    }

    const filteredHistoryData = useMemo(() => filterData(historyData), [historyData, searchTerm, selectedMembers, startDate, endDate]);
    const filteredDelegationHistoryData = useMemo(() => filterData(delegationHistoryData), [delegationHistoryData, searchTerm, selectedMembers, startDate, endDate]);

    const getFilteredMembersList = () => {
        if (userRole === "admin") return useApprovalStore.getState().membersList; // Access latest list
        return useApprovalStore.getState().membersList.filter((member) => member.toLowerCase() === username.toLowerCase());
    };

    return {
        // Data
        filteredHistoryData,
        filteredDelegationHistoryData,
        getFilteredMembersList,
        username,
        userRole,

        // Actions
        fetchMoreData,
        handleEditClick,
        handleCancelEdit,
        handleSaveEdit,
        handleMarkMultipleDone,
        confirmMarkDone
    };
};
