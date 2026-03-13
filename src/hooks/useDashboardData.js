import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDashboardStore } from '../store/useDashboardStore';


import {
    fetchDashboardDataApi as fetchApi,
    getUniqueDepartmentsApi as getDeptApi,
    getStaffNamesByDepartmentApi as getStaffApi,
    fetchChecklistDataByDateRangeApi as fetchDateRangeApi,
    getDashboardDateRangeStatsApi as getStatsApi
} from '../redux/api/dashboardApi';

import {
    completeTaskInTable,
    overdueTaskInTable,
    pendingTaskInTable,
    totalTaskInTable,
} from '../redux/slice/dashboardSlice';

import {
    parseTaskStartDate,
    formatDateToDDMMYYYY,
    isDateInPast,
    ensureYYYYMMDD
} from '../utils/dateUtils';

export const useDashboardData = () => {
    const dispatch = useDispatch();
    const {
        dashboardType,
        dashboardStaffFilter,
        departmentFilter,
        currentPage,
        batchSize = 1000,
        dateRange,
        setDateRange,
        setAvailableStaff,
        setAvailableDepartments,
        setHasMoreData,
        setIsLoadingMore,
        isLoadingMore,
        setCurrentPage,
        setFilteredDateStats
    } = useDashboardStore();

    // Redux State
    const { dashboard, totalTask, completeTask, pendingTask, overdueTask } = useSelector((state) => state.dashBoard);

    // Local Data State
    const [departmentData, setDepartmentData] = useState({
        allTasks: [],
        staffMembers: [],
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        barChartData: [],
        pieChartData: [],
        completedRatingOne: 0,
        completedRatingTwo: 0,
        completedRatingThreePlus: 0,
    });

    // Helper: Process Filtered Data
    const processFilteredData = (data, stats, isFilteredOverride = false) => {
        const username = localStorage.getItem("user-name");
        const userRole = localStorage.getItem("role");
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        let totalTasks = 0;
        let completedTasks = 0;
        let pendingTasks = 0;
        let overdueTasks = 0;

        const monthlyData = {
            Jan: { completed: 0, pending: 0 },
            Feb: { completed: 0, pending: 0 },
            Mar: { completed: 0, pending: 0 },
            Apr: { completed: 0, pending: 0 },
            May: { completed: 0, pending: 0 },
            Jun: { completed: 0, pending: 0 },
            Jul: { completed: 0, pending: 0 },
            Aug: { completed: 0, pending: 0 },
            Sep: { completed: 0, pending: 0 },
            Oct: { completed: 0, pending: 0 },
            Nov: { completed: 0, pending: 0 },
            Dec: { completed: 0, pending: 0 },
        };

        // Process tasks
        const processedTasks = data
            .map((task) => {
                // Skip if not assigned to current user (for non-admin)
                if (userRole !== "admin" && task.name?.toLowerCase() !== username?.toLowerCase()) {
                    return null;
                }

                const taskStartDate = parseTaskStartDate(task.task_start_date);
                const completionDate = task.submission_date ? parseTaskStartDate(task.submission_date) : null;

                let status = "pending";
                if (completionDate) {
                    status = "completed";
                } else if (taskStartDate && isDateInPast(taskStartDate)) {
                    status = "overdue";
                }

                // Count tasks for statistics
                if (taskStartDate) {
                    totalTasks++;

                    if (dashboardType === "checklist") {
                        if (task.status === 'Yes') {
                            completedTasks++;
                        } else {
                            pendingTasks++;
                        }

                        if (taskStartDate && taskStartDate < today && task.status !== 'Yes') {
                            overdueTasks++;
                        }
                    } else {
                        if (task.submission_date) {
                            completedTasks++;
                        } else {
                            pendingTasks++;
                            if (taskStartDate && taskStartDate < today) {
                                overdueTasks++;
                            }
                        }
                    }
                }

                // Update monthly data
                if (taskStartDate) {
                    const monthName = taskStartDate.toLocaleString("default", { month: "short" });
                    if (monthlyData[monthName]) {
                        if (status === "completed") {
                            monthlyData[monthName].completed++;
                        } else {
                            monthlyData[monthName].pending++;
                        }
                    }
                }

                return {
                    id: task.task_id,
                    title: task.task_description,
                    assignedTo: task.name || "Unassigned",
                    taskStartDate: formatDateToDDMMYYYY(taskStartDate),
                    originalTaskStartDate: task.task_start_date,
                    submission_date: task.submission_date,
                    status,
                    frequency: task.frequency || "one-time",
                    rating: task.color_code_for || 0,
                };
            })
            .filter(Boolean);

        const barChartData = Object.entries(monthlyData).map(([name, data]) => ({
            name,
            completed: data.completed,
            pending: data.pending,
        }));

        const pieChartData = [
            { name: "Completed", value: completedTasks, color: "#22c55e" },
            { name: "Pending", value: pendingTasks, color: "#facc15" },
            { name: "Overdue", value: overdueTasks, color: "#ef4444" },
        ];

        // Use passed stats or calculated ones
        const finalStats = stats || {
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,
            completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
        };

        setDepartmentData(prev => ({
            ...prev,
            allTasks: processedTasks,
            totalTasks: finalStats.totalTasks,
            completedTasks: finalStats.completedTasks,
            pendingTasks: finalStats.pendingTasks,
            overdueTasks: finalStats.overdueTasks,
            completionRate: finalStats.completionRate,
            barChartData,
            pieChartData,
        }));

        // Also update date range stats if we are filtering
        if (dateRange.filtered || isFilteredOverride) {
            useDashboardStore.getState().setFilteredDateStats({ // Access store directly or expose setter
                totalTasks: finalStats.totalTasks,
                completedTasks: finalStats.completedTasks,
                pendingTasks: finalStats.pendingTasks,
                overdueTasks: finalStats.overdueTasks,
                completionRate: finalStats.completionRate,
            });
        }
    };

    // Fetch Department Data
    const fetchDepartmentData = async (page = 1, append = false) => {
        try {
            if (page === 1) {
                setIsLoadingMore(true);
                setHasMoreData(true);
            } else {
                setIsLoadingMore(true);
            }

            const data = await fetchApi(dashboardType, dashboardStaffFilter, page, batchSize, 'all', departmentFilter);

            if (!data || data.length === 0) {
                if (page === 1) {
                    setDepartmentData(prev => ({
                        ...prev,
                        allTasks: [],
                        totalTasks: 0,
                        completedTasks: 0,
                        pendingTasks: 0,
                        overdueTasks: 0,
                        completionRate: 0,
                    }));
                }
                setHasMoreData(false);
                setIsLoadingMore(false);
                return;
            }

            const username = localStorage.getItem("user-name");
            const userRole = localStorage.getItem("role");
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            // ... (Logic from original fetchDepartmentData for generic processing)
            // Simplified here to use similar processing logic

            // FIRST: Filter data by dashboard type - REMOVE this filter for checklist to include all tasks
            let filteredData = data

            // Extract unique staff names
            let uniqueStaff;
            if (dashboardType === 'checklist' && departmentFilter !== 'all') {
                try {
                    uniqueStaff = await getStaffApi(departmentFilter);
                } catch (error) {
                    console.error('Error fetching staff by department:', error);
                    uniqueStaff = [...new Set(data.map((task) => task.name).filter((name) => name && name.trim() !== ""))];
                }
            } else {
                uniqueStaff = [...new Set(data.map((task) => task.name).filter((name) => name && name.trim() !== ""))];
            }

            if (userRole !== "admin" && username) {
                if (!uniqueStaff.some(staff => staff.toLowerCase() === username.toLowerCase())) {
                    uniqueStaff.push(username)
                }
            }
            setAvailableStaff(uniqueStaff)

            // SECOND: Apply dashboard staff filter ONLY if not "all"
            if (dashboardStaffFilter !== "all") {
                filteredData = filteredData.filter(
                    (task) => task.name && task.name.toLowerCase() === dashboardStaffFilter.toLowerCase(),
                )
            }

            // Process Tasks Loop (Original logic refactored)
            let totalTasks = 0
            let completedTasks = 0
            let pendingTasks = 0
            let overdueTasks = 0
            let completedRatingOne = 0
            let completedRatingTwo = 0
            let completedRatingThreePlus = 0

            const monthlyData = {
                Jan: { completed: 0, pending: 0 },
                Feb: { completed: 0, pending: 0 },
                Mar: { completed: 0, pending: 0 },
                Apr: { completed: 0, pending: 0 },
                May: { completed: 0, pending: 0 },
                Jun: { completed: 0, pending: 0 },
                Jul: { completed: 0, pending: 0 },
                Aug: { completed: 0, pending: 0 },
                Sep: { completed: 0, pending: 0 },
                Oct: { completed: 0, pending: 0 },
                Nov: { completed: 0, pending: 0 },
                Dec: { completed: 0, pending: 0 },
            }

            const processedTasks = filteredData
                .map((task) => {
                    if (userRole !== "admin" && task.name?.toLowerCase() !== username?.toLowerCase()) {
                        return null;
                    }

                    const taskStartDate = parseTaskStartDate(task.task_start_date);
                    const completionDate = task.submission_date ? parseTaskStartDate(task.submission_date) : null;

                    let status = "pending";
                    if (completionDate) {
                        status = "completed";
                    } else if (taskStartDate && isDateInPast(taskStartDate)) {
                        status = "overdue";
                    }

                    // Only count tasks up to today for cards (but keep all tasks for table display)
                    if (taskStartDate && taskStartDate <= today) {
                        if (status === "completed") {
                            completedTasks++;
                            if (dashboardType === "delegation" && task.submission_date) {
                                if (task.color_code_for === 1) completedRatingOne++;
                                else if (task.color_code_for === 2) completedRatingTwo++;
                                else if (task.color_code_for >= 3) completedRatingThreePlus++;
                            }
                        } else {
                            pendingTasks++;
                            if (status === "overdue") overdueTasks++;
                        }
                        totalTasks++;
                    }

                    // Update monthly data for all tasks
                    if (taskStartDate) {
                        const monthName = taskStartDate.toLocaleString("default", { month: "short" });
                        if (monthlyData[monthName]) {
                            if (status === "completed") {
                                monthlyData[monthName].completed++;
                            } else {
                                monthlyData[monthName].pending++;
                            }
                        }
                    }

                    return {
                        id: task.task_id,
                        title: task.task_description,
                        assignedTo: task.name || "Unassigned",
                        taskStartDate: formatDateToDDMMYYYY(taskStartDate),
                        originalTaskStartDate: task.task_start_date,
                        submission_date: task.submission_date,
                        status,
                        frequency: task.frequency || "one-time",
                        rating: task.color_code_for || 0,
                    };

                }).filter(Boolean);

            const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0

            const barChartData = Object.entries(monthlyData).map(([name, data]) => ({
                name,
                completed: data.completed,
                pending: data.pending,
            }))

            const pieChartData = [
                { name: "Completed", value: completedTasks, color: "#22c55e" },
                { name: "Pending", value: pendingTasks, color: "#facc15" },
                { name: "Overdue", value: overdueTasks, color: "#ef4444" },
            ]

            // Calculate Staff Stats
            const staffMap = new Map()
            if (processedTasks.length > 0) {
                processedTasks.forEach((task) => {
                    const taskDate = parseTaskStartDate(task.originalTaskStartDate)
                    // Only include tasks up to today for staff calculations
                    if (taskDate && taskDate <= today) {
                        const assignedTo = task.assignedTo || "Unassigned"
                        if (!staffMap.has(assignedTo)) {
                            staffMap.set(assignedTo, {
                                name: assignedTo,
                                totalTasks: 0,
                                completedTasks: 0,
                                pendingTasks: 0,
                            })
                        }
                        const staff = staffMap.get(assignedTo)
                        staff.totalTasks++
                        if (task.status === "completed") {
                            staff.completedTasks++
                        } else {
                            staff.pendingTasks++
                        }
                    }
                })
            }

            const staffMembers = Array.from(staffMap.values()).map((staff) => ({
                ...staff,
                id: (staff.name || "unassigned").replace(/\s+/g, "-").toLowerCase(),
                email: `${(staff.name || "unassigned").toLowerCase().replace(/\s+/g, ".")}@example.com`,
                progress: staff.totalTasks > 0 ? Math.round((staff.completedTasks / staff.totalTasks) * 100) : 0,
            }))

            setDepartmentData(prev => {
                const updatedTasks = append
                    ? [...prev.allTasks, ...processedTasks]
                    : processedTasks

                return {
                    allTasks: updatedTasks,
                    staffMembers,
                    totalTasks: append ? prev.totalTasks + totalTasks : totalTasks,
                    completedTasks: append ? prev.completedTasks + completedTasks : completedTasks,
                    pendingTasks: append ? prev.pendingTasks + pendingTasks : pendingTasks,
                    overdueTasks: append ? prev.overdueTasks + overdueTasks : overdueTasks,
                    completionRate: append
                        ? (updatedTasks.filter(t => t.status === "completed").length / updatedTasks.length * 100).toFixed(1)
                        : completionRate,
                    barChartData,
                    pieChartData,
                    completedRatingOne: append ? prev.completedRatingOne + completedRatingOne : completedRatingOne,
                    completedRatingTwo: append ? prev.completedRatingTwo + completedRatingTwo : completedRatingTwo,
                    completedRatingThreePlus: append ? prev.completedRatingThreePlus + completedRatingThreePlus : completedRatingThreePlus,
                }
            })

            if (data.length < batchSize) {
                setHasMoreData(false)
            }

            setIsLoadingMore(false)

        } catch (error) {
            console.error(`Error fetching ${dashboardType} data:`, error);
            setIsLoadingMore(false);
        }
    };

    // Date Range Helpers
    const fetchDepartmentDataWithDateRange = async (startDate, endDate) => {
        try {
            const normalizedStart = ensureYYYYMMDD(startDate);
            const normalizedEnd = ensureYYYYMMDD(endDate);

            const data = await fetchApi(dashboardType, dashboardStaffFilter, 1, batchSize, 'all', departmentFilter, normalizedStart, normalizedEnd);

            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const filteredData = data.filter(task => {
                const taskDate = parseTaskStartDate(task.task_start_date);
                return taskDate && taskDate >= start && taskDate <= end;
            });

            // Calculate stats manually with proper logic
            let totalTasks = filteredData.length;
            let completedTasks = 0;
            let pendingTasks = 0;
            let overdueTasks = 0;
            let notDoneTasks = 0;

            filteredData.forEach(task => {
                const taskDate = parseTaskStartDate(task.task_start_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (dashboardType === "checklist") {
                    if (task.status === 'Yes') {
                        completedTasks++;
                    } else if (task.status === 'No') {
                        notDoneTasks++;
                        pendingTasks++;
                    } else {
                        pendingTasks++;
                    }
                    if (taskDate && taskDate < today && task.status !== 'Yes') {
                        overdueTasks++;
                    }
                } else {
                    if (task.submission_date) {
                        completedTasks++;
                    } else {
                        pendingTasks++;
                        if (taskDate && taskDate < today) {
                            overdueTasks++;
                        }
                    }
                    notDoneTasks = pendingTasks;
                }
            });

            const stats = {
                totalTasks,
                completedTasks,
                pendingTasks,
                overdueTasks,
                notDoneTasks,
                completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0
            };

            processFilteredData(filteredData, stats, true);

        } catch (error) {
            console.error("Error fetching data with date range:", error);
        }
    }

    const handleDateRangeChange = async (startDate, endDate) => {
        if (startDate && endDate) {
            setDateRange({
                startDate,
                endDate,
                filtered: true
            });

            try {
                setIsLoadingMore(true);

                if (dashboardType === "checklist") {
                    const normalizedStart = ensureYYYYMMDD(startDate);
                    const normalizedEnd = ensureYYYYMMDD(endDate);

                    const filteredData = await fetchDateRangeApi(
                        normalizedStart,
                        normalizedEnd,
                        dashboardStaffFilter,
                        departmentFilter,
                        1,
                        batchSize,
                        'all'
                    );

                    const stats = await getStatsApi(
                        dashboardType,
                        normalizedStart,
                        normalizedEnd,
                        dashboardStaffFilter,
                        departmentFilter
                    );

                    processFilteredData(filteredData, stats, true);
                } else {
                    await fetchDepartmentDataWithDateRange(startDate, endDate);
                }
            } catch (error) {
                console.error("Error fetching date range data:", error);
            } finally {
                setIsLoadingMore(false);
            }
        } else {
            setDateRange({
                startDate: "",
                endDate: "",
                filtered: false
            });
            useDashboardStore.getState().setFilteredDateStats({
                totalTasks: 0,
                completedTasks: 0,
                pendingTasks: 0,
                overdueTasks: 0,
                completionRate: 0,
            });

            fetchDepartmentData(1, false);
        }
    };

    const fetchDepartments = async () => {
        if (dashboardType === 'checklist') {
            try {
                const departments = await getDeptApi();
                const userAccess = localStorage.getItem("user_access") || "";
                const userDepartments = userAccess
                    ? userAccess.split(',').map(dept => dept.trim().toLowerCase())
                    : [];
                const userRole = localStorage.getItem("role");

                let filteredDepartments = departments;
                if (userRole === "admin" && userDepartments.length > 0) {
                    filteredDepartments = departments.filter(dept =>
                        userDepartments.includes(dept.toLowerCase())
                    );
                }
                setAvailableDepartments(filteredDepartments);
            } catch (error) {
                console.error('Error fetching departments:', error);
                setAvailableDepartments([]);
            }
        } else {
            setAvailableDepartments([]);
        }
    }

    // Initial Effects
    useEffect(() => {
        fetchDepartments();
    }, [dashboardType]);

    useEffect(() => {
        fetchDepartmentData(1, false);

        dispatch(
            totalTaskInTable({
                dashboardType,
                staffFilter: dashboardStaffFilter,
                departmentFilter,
            }),
        )
        dispatch(
            completeTaskInTable({
                dashboardType,
                staffFilter: dashboardStaffFilter,
                departmentFilter,
            }),
        )
        dispatch(
            pendingTaskInTable({
                dashboardType,
                staffFilter: dashboardStaffFilter,
                departmentFilter,
            }),
        )
        dispatch(
            overdueTaskInTable({
                dashboardType,
                staffFilter: dashboardStaffFilter,
                departmentFilter,
            }),
        )
    }, [dashboardType, dashboardStaffFilter, departmentFilter, dispatch]); // Added relevant deps

    // Scroll Handler
    useEffect(() => {
        const handleScroll = () => {
            const tableContainer = document.querySelector('.task-table-container')
            if (!tableContainer) return

            const { scrollTop, scrollHeight, clientHeight } = tableContainer
            const isNearBottom = scrollHeight - scrollTop <= clientHeight * 1.2

            if (isNearBottom && !isLoadingMore && useDashboardStore.getState().hasMoreData) {
                const nextPage = currentPage + 1;
                setCurrentPage(nextPage);
                fetchDepartmentData(nextPage, true);
            }
        }

        const tableContainer = document.querySelector('.task-table-container')
        if (tableContainer) {
            tableContainer.addEventListener('scroll', handleScroll)
            return () => tableContainer.removeEventListener('scroll', handleScroll)
        }
    }, [isLoadingMore, currentPage]); // Simplified deps

    return {
        departmentData,
        handleDateRangeChange,
        fetchDepartmentData
    };
};
