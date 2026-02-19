import { useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  resetChecklistPagination,
  uniqueChecklistTaskData,
  uniqueDelegationTaskData,
  resetDelegationPagination,
} from "../redux/slice/quickTaskSlice";
import useQuickTaskUIStore from "../stores/useQuickTaskUIStore";

export const useQuickTaskData = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  const {
    quickTask,
    loading,
    delegationTasks,
    users,
    checklistPage,
    checklistHasMore,
    delegationPage,
    delegationHasMore,
  } = useSelector((state) => state.quickTask);

  const {
    activeTab,
    nameFilter,
    searchTerm,
    freqFilter,
    sortConfig,
    setSortConfig,
    toggleDropdown,
    closeDropdowns,
  } = useQuickTaskUIStore();

  // Initial Fetch
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(resetChecklistPagination());
    dispatch(
      uniqueChecklistTaskData({ page: 0, pageSize: 50, nameFilter: "" }),
    );
  }, [dispatch]);

  // Derived Data
  const allNames = useMemo(() => {
    return [...new Set(users.map((u) => u.user_name))]
      .filter((name) => name && typeof name === "string" && name.trim() !== "")
      .sort();
  }, [users]);

  const allFrequencies = useMemo(() => {
    return [
      ...new Set([
        ...quickTask.map((t) => t.frequency),
        ...delegationTasks.map((t) => t.frequency),
      ]),
    ].filter((f) => f && typeof f === "string" && f.trim() !== "");
  }, [quickTask, delegationTasks]);

  // Filtering Logic for Checklist
  const filteredChecklistTasks = useMemo(() => {
    let filtered = quickTask.filter((task) => {
      const freqPass = !freqFilter || task.frequency === freqFilter;
      const searchPass =
        !searchTerm ||
        task.task_description?.toLowerCase().includes(searchTerm.toLowerCase());
      const namePass = !nameFilter || task.name === nameFilter;
      return namePass && freqPass && searchPass;
    });
    console.log("Filtered Checklist Tasks", filtered);

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [quickTask, freqFilter, searchTerm, sortConfig]);

  // Infinite Scroll Handler
  const handleScroll = useCallback(() => {
    if (!tableContainerRef.current || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      if (activeTab === "checklist" && checklistHasMore) {
        dispatch(
          uniqueChecklistTaskData({
            page: checklistPage,
            pageSize: 50,
            nameFilter,
            append: true,
          }),
        );
      } else if (activeTab === "delegation" && delegationHasMore) {
        dispatch(
          uniqueDelegationTaskData({
            page: delegationPage,
            pageSize: 50,
            nameFilter,
            append: true,
          }),
        );
      }
    }
  }, [
    loading,
    activeTab,
    checklistPage,
    checklistHasMore,
    delegationPage,
    delegationHasMore,
    nameFilter,
    dispatch,
  ]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]); // Re-attach listener if dependencies change

  // Reload when Tab/Filters change
  const handleTabChange = (tab) => {
    if (tab === "checklist") {
      dispatch(resetChecklistPagination());
      dispatch(uniqueChecklistTaskData({ page: 0, pageSize: 50, nameFilter }));
    } else {
      dispatch(resetDelegationPagination());
      dispatch(uniqueDelegationTaskData({ page: 0, pageSize: 50, nameFilter }));
    }
  };

  const handleNameFilterSelect = (name) => {
    if (activeTab === "checklist") {
      dispatch(resetChecklistPagination());
      dispatch(
        uniqueChecklistTaskData({ page: 0, pageSize: 50, nameFilter: name }),
      );
    } else {
      dispatch(resetDelegationPagination());
      dispatch(
        uniqueDelegationTaskData({ page: 0, pageSize: 50, nameFilter: name }),
      );
    }
    closeDropdowns();
  };

  return {
    tableContainerRef,
    filteredChecklistTasks,
    loading,
    allNames,
    allFrequencies,
    handleTabChange,
    handleNameFilterSelect,
    checklistHasMore,
  };
};
