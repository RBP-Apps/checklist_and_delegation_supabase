import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { delegationData, delegation_DoneData } from '../redux/slice/delegationSlice';
import useDelegationUIStore from '../stores/useDelegationUIStore';
import supabase from '../SupabaseClient';

// Simple debounce hook (moved from file)
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export const useDelegationData = () => {
    const dispatch = useDispatch();
    const { loading, error, delegation, delegation_done } = useSelector((state) => state.delegation);

    // Local user details
    const [userRole, setUserRole] = useState("");
    const [username, setUsername] = useState("");
    const [users, setUsers] = useState([]);
    const [givenByList, setGivenByList] = useState([]);

    const { searchTerm, dateFilter, nameFilter, givenByFilter, startDate, endDate, statusData } = useDelegationUIStore();
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        const role = localStorage.getItem("role");
        const user = localStorage.getItem("user-name");
        setUserRole(role || "");
        setUsername(user || "");

        // Fetch Data
        dispatch(delegationData());
        dispatch(delegation_DoneData());

        // Fetch Users for filter
        const fetchUsers = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('user_name')
                .order('user_name', { ascending: true });
            if (data) {
                // Remove duplicates if any and set users
                const uniqueNames = [...new Set(data.map(u => u.user_name))].filter(Boolean);
                setUsers(uniqueNames);
            }
        };

        const fetchGivenBy = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('given_by')
                .not('given_by', 'is', null) // filter out nulls
                .order('given_by', { ascending: true });
            if (data) {
                const uniqueGivenBy = [...new Set(data.map(u => u.given_by))].filter(Boolean);
                setGivenByList(uniqueGivenBy);
            }
        };

        fetchUsers();
        fetchGivenBy();
    }, [dispatch]);

    // Filter Active Tasks
    const activeTasks = useMemo(() => {
        if (!delegation) return [];
        let filtered = delegation;

        const itemHasStatus = (task) => {
            return statusData && statusData[task.task_id] && statusData[task.task_id] !== "";
        };

        if (debouncedSearchTerm) {
            filtered = filtered.filter((task) =>
                Object.values(task).some(value =>
                    value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                )
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextFewDays = new Date(today);
        nextFewDays.setDate(nextFewDays.getDate() + 3);
        nextFewDays.setHours(23, 59, 59, 999);

        // Date logic synchronized with SalesDataPage
        filtered = filtered.filter((task) => {
            if (!task.task_start_date) return false;
            const taskStartDate = new Date(task.task_start_date);
            if (isNaN(taskStartDate.getTime())) return false;

            const isPending = !task.submission_date && !itemHasStatus(task);

            // Frequency-based visibility window
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const freq = (task.frequency || "").toLowerCase();

            let visibilityLimit = new Date(today);
            if (freq === "daily") {
                visibilityLimit.setDate(today.getDate() + 2);
            } else if (freq === "monthly") {
                visibilityLimit = new Date(today.getFullYear(), today.getMonth() + 2, 0);
            } else if (freq.includes("weekly") || freq.includes("alternate") || freq.includes("fortnightly")) {
                visibilityLimit.setDate(today.getDate() + 14);
            } else {
                visibilityLimit.setDate(today.getDate() + 30);
            }
            visibilityLimit.setHours(23, 59, 59, 999);

            const isWithinVisibleWindow = taskStartDate <= visibilityLimit;
            const isOverduePending = taskStartDate < today && isPending;

            if (dateFilter === "overdue") return isOverduePending;
            if (dateFilter === "today") return taskStartDate.toDateString() === today.toDateString();
            if (dateFilter === "upcoming") return taskStartDate > today && isWithinVisibleWindow;

            return isWithinVisibleWindow || isOverduePending;
        });

        // Filter by user_name if nameFilter is set
        if (nameFilter && nameFilter !== "All Names") {
            filtered = filtered.filter((task) => 
                task.name && task.name.toLowerCase() === nameFilter.toLowerCase()
            );
        }

        // Filter by given_by if givenByFilter is set
        if (givenByFilter && givenByFilter !== "All Given By") {
            filtered = filtered.filter((task) => 
                task.given_by && task.given_by.toLowerCase() === givenByFilter.toLowerCase()
            );
        }

        return filtered;
    }, [delegation, debouncedSearchTerm, dateFilter, nameFilter, givenByFilter, statusData]);

    // Filter History Tasks
    const historyTasks = useMemo(() => {
        if (!delegation_done) return [];

        return delegation_done
            .filter((item) => {
                const userMatch = userRole === "admin" || (item.name && item.name.toLowerCase() === username.toLowerCase());
                if (!userMatch) return false;

                const matchesSearch = debouncedSearchTerm
                    ? Object.values(item).some(value => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
                    : true;

                // Range logic
                let matchesRange = true;
                if (startDate || endDate) {
                    const itemDate = item.created_at ? new Date(item.created_at) : null;
                    if (!itemDate || isNaN(itemDate.getTime())) return false;

                    if (startDate) {
                        const s = new Date(startDate); s.setHours(0, 0, 0, 0);
                        if (itemDate < s) matchesRange = false;
                    }
                    if (endDate) {
                        const e = new Date(endDate); e.setHours(23, 59, 59, 999);
                        if (itemDate > e) matchesRange = false;
                    }
                }

                const matchesName = (nameFilter === "All Names") || 
                                  (item.name && item.name.toLowerCase() === nameFilter.toLowerCase());

                const matchesGivenBy = (givenByFilter === "All Given By") || 
                                     (item.given_by && item.given_by.toLowerCase() === givenByFilter.toLowerCase());

                return matchesSearch && matchesRange && matchesName && matchesGivenBy;
            })
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [delegation_done, debouncedSearchTerm, startDate, endDate, userRole, username, nameFilter, givenByFilter]);

    const refreshData = () => {
        dispatch(delegationData());
        dispatch(delegation_DoneData());
    };

    return {
        loading,
        error,
        activeTasks,
        historyTasks,
        userRole,
        username,
        users,
        givenByList,
        refreshData
    };
};
