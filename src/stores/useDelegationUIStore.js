import { create } from 'zustand';

const useDelegationUIStore = create((set, get) => ({
    // --- Filters ---
    searchTerm: "",
    dateFilter: "all",
    nameFilter: "All Names",
    givenByFilter: "All Given By",
    startDate: "",
    endDate: "",
    showHistory: false,

    // --- Selection & Form Data ---
    selectedItems: new Set(),
    statusData: {},
    nextTargetDate: {},
    remarksData: {},
    uploadedImages: {},

    // --- Actions ---
    setSearchTerm: (term) => set({ searchTerm: term }),
    setDateFilter: (filter) => set({ dateFilter: filter }),
    setNameFilter: (name) => set({ nameFilter: name }),
    setGivenByFilter: (givenBy) => set({ givenByFilter: givenBy }),
    setStartDate: (date) => set({ startDate: date }),
    setEndDate: (date) => set({ endDate: date }),
    toggleHistory: () => set((state) => ({
        showHistory: !state.showHistory,
        // Reset filters when toggling
        searchTerm: "", startDate: "", endDate: "", dateFilter: "all", nameFilter: "All Names", givenByFilter: "All Given By"
    })),

    // --- Selection Actions ---
    toggleSelection: (id, isChecked) => set((state) => {
        const newSelected = new Set(state.selectedItems);
        const newStatus = { ...state.statusData };
        const newNextDate = { ...state.nextTargetDate };
        const newRemarks = { ...state.remarksData };
        const newAdditional = { ...state.additionalData };

        if (isChecked) {
            newSelected.add(id);
            newStatus[id] = "Done";
        } else {
            newSelected.delete(id);
            delete newStatus[id];
            delete newNextDate[id];
            delete newRemarks[id];
        }

        return {
            selectedItems: newSelected,
            statusData: newStatus,
            nextTargetDate: newNextDate,
            remarksData: newRemarks,
        };
    }),

    selectAll: (ids, isChecked) => set((state) => {
        if (isChecked) {
            const newStatus = { ...state.statusData };
            ids.forEach(id => newStatus[id] = "Done");
            return {
                selectedItems: new Set(ids),
                statusData: newStatus
            };
        } else {
            return {
                selectedItems: new Set(),
                statusData: {},
                nextTargetDate: {},
                remarksData: {},
                uploadedImages: {} // Should we clear images? Yes usually.
            };
        }
    }),

    updateStatus: (id, status) => set((state) => {
        const newStatus = { ...state.statusData, [id]: status };
        const newNextDate = { ...state.nextTargetDate };
        if (status === "Done") {
            delete newNextDate[id];
        }
        return { statusData: newStatus, nextTargetDate: newNextDate };
    }),

    updateNextTargetDate: (id, date) => set((state) => ({
        nextTargetDate: { ...state.nextTargetDate, [id]: date }
    })),

    updateRemarks: (id, remark) => set((state) => ({
        remarksData: { ...state.remarksData, [id]: remark }
    })),

    uploadImage: (id, file) => set((state) => ({
        uploadedImages: { ...state.uploadedImages, [id]: file }
    })),

    resetForm: () => set({
        selectedItems: new Set(),
        statusData: {},
        nextTargetDate: {},
        remarksData: {},
        uploadedImages: {}
    }),
}));

export default useDelegationUIStore;
