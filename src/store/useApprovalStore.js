import { create } from 'zustand';

const useApprovalStore = create((set, get) => ({
    // UI State
    activeApprovalTab: 'checklist', // 'checklist' | 'delegation'
    searchTerm: '',
    memberSearchTerm: '',
    showMemberDropdown: false,
    selectedMembers: [],
    startDate: '',
    endDate: '',

    // Data State
    historyData: [],
    delegationHistoryData: [],
    totalChecklistCount: 0,
    totalDelegationCount: 0,
    totalAdminDoneChecklist: 0,
    totalAdminDoneDelegation: 0,
    checklistPage: 1,
    delegationPage: 1,
    hasMoreChecklist: true,
    hasMoreDelegation: true,
    isLoadingMore: false,
    membersList: [],
    loading: true,
    error: null,
    successMessage: '',

    // Admin Action State
    editingRows: new Set(),
    editedAdminStatus: {},
    savingEdits: new Set(),
    selectedHistoryItems: [],
    markingAsDone: false,
    confirmationModal: {
        isOpen: false,
        itemCount: 0,
    },

    // Setters
    setActiveApprovalTab: (tab) => set({ activeApprovalTab: tab }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setMemberSearchTerm: (term) => set({ memberSearchTerm: term }),
    setShowMemberDropdown: (isOpen) => set({ showMemberDropdown: isOpen }),

    setSelectedMembers: (members) => {
        // Handle function update or direct value
        if (typeof members === 'function') {
            set((state) => ({ selectedMembers: members(state.selectedMembers) }));
        } else {
            set({ selectedMembers: members });
        }
    },

    setStartDate: (date) => set({ startDate: date }),
    setEndDate: (date) => set({ endDate: date }),

    setHistoryData: (data) => {
        if (typeof data === 'function') {
            set((state) => ({ historyData: data(state.historyData) }));
        } else {
            set({ historyData: data });
        }
    },

    setDelegationHistoryData: (data) => {
        if (typeof data === 'function') {
            set((state) => ({ delegationHistoryData: data(state.delegationHistoryData) }));
        } else {
            set({ delegationHistoryData: data });
        }
    },

    setMembersList: (list) => set({ membersList: list }),
    setLoading: (loading) => set({ loading }),
    setIsLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
    setChecklistPage: (page) => set({ checklistPage: page }),
    setDelegationPage: (page) => set({ delegationPage: page }),
    setHasMoreChecklist: (hasMore) => set({ hasMoreChecklist: hasMore }),
    setHasMoreDelegation: (hasMore) => set({ hasMoreDelegation: hasMore }),
    setTotalChecklistCount: (count) => set({ totalChecklistCount: count }),
    setTotalDelegationCount: (count) => set({ totalDelegationCount: count }),
    setTotalAdminDoneChecklist: (count) => set({ totalAdminDoneChecklist: count }),
    setTotalAdminDoneDelegation: (count) => set({ totalAdminDoneDelegation: count }),
    setError: (error) => set({ error }),
    setSuccessMessage: (msg) => set({ successMessage: msg }),

    setEditingRows: (value) => {
        // Handle Set updates usually require creating a new Set
        if (typeof value === 'function') {
            set((state) => ({ editingRows: value(state.editingRows) }));
        } else {
            set({ editingRows: value });
        }
    },

    setEditedAdminStatus: (status) => {
        if (typeof status === 'function') {
            set((state) => ({ editedAdminStatus: status(state.editedAdminStatus) }));
        } else {
            set({ editedAdminStatus: status });
        }
    },

    setSavingEdits: (value) => {
        if (typeof value === 'function') {
            set((state) => ({ savingEdits: value(state.savingEdits) }));
        } else {
            set({ savingEdits: value });
        }
    },

    setSelectedHistoryItems: (items) => {
        if (typeof items === 'function') {
            set((state) => ({ selectedHistoryItems: items(state.selectedHistoryItems) }));
        } else {
            set({ selectedHistoryItems: items });
        }
    },

    setMarkingAsDone: (isMarking) => set({ markingAsDone: isMarking }),
    setConfirmationModal: (modal) => set({ confirmationModal: modal }),

    // Helpers
    resetFilters: () => set({
        searchTerm: '',
        selectedMembers: [],
        startDate: '',
        endDate: ''
    }),

    // Selection Helper
    handleMemberSelection: (member) => set((state) => {
        const prev = state.selectedMembers;
        if (prev.includes(member)) {
            return { selectedMembers: prev.filter((item) => item !== member) };
        } else {
            return { selectedMembers: [...prev, member] };
        }
    }),
}));

export default useApprovalStore;
