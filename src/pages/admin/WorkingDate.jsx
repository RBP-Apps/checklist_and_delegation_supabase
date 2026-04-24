import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import {
    Calendar,
    Clock,
    CalendarDays,
    Send,
    Loader2,
    CheckCircle,
    AlertCircle,
    Search,
} from "lucide-react";
import supabase from "../../SupabaseClient";

function WorkingDate() {
    const [activeTab, setActiveTab] = useState("workingDate");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [username, setUsername] = useState("");
    const [userRole, setUserRole] = useState("");
    const [historyData, setHistoryData] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [filterName, setFilterName] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [uniqueNames, setUniqueNames] = useState([]);

    // Live clock state
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    // Time slots array
    const timeSlots = [
        "09:30 AM",
        "10:30 AM",
        "11:30 AM",
        "12:30 PM",
        "01:30 PM",
        "02:30 PM",
        "03:30 PM",
        "04:30 PM",
        "05:30 PM",
        "06:30 PM",
        "07:30 PM",
        "08:30 PM",
        "09:30 PM",
    ];

    // State for working details, quantity, and message
    const [workingDetails, setWorkingDetails] = useState(
        timeSlots.reduce((acc, time) => ({ ...acc, [time]: "" }), {}),
    );

    const [quantities, setQuantities] = useState(
        timeSlots.reduce((acc, time) => ({ ...acc, [time]: "" }), {}),
    );

    // User-selected date and time for submission
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        return now.toISOString().split("T")[0]; // YYYY-MM-DD format for input
    });
    const [selectedTime, setSelectedTime] = useState(() => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    });

    // Get username and role from localStorage
    useEffect(() => {
        const storedUsername = localStorage.getItem("user-name");
        const storedRole = localStorage.getItem("role");
        setUsername(storedUsername || "Unknown");
        setUserRole(storedRole?.toLowerCase().trim() || "user");
    }, []);

    // Load saved working details from localStorage when username is available
    useEffect(() => {
        if (username && username !== "Unknown") {
            const storageKey = `workingDetails_${username}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    // Merge with existing timeSlots structure to ensure all slots exist
                    const mergedDetails = timeSlots.reduce(
                        (acc, time) => ({
                            ...acc,
                            [time]: parsed.details?.[time] || "",
                        }),
                        {},
                    );
                    const mergedQuantities = timeSlots.reduce(
                        (acc, time) => ({
                            ...acc,
                            [time]: parsed.quantities?.[time] || "",
                        }),
                        {},
                    );

                    setWorkingDetails(mergedDetails);
                    setQuantities(mergedQuantities);
                    console.log("Restored working details for", username);
                } catch (e) {
                    console.error("Error parsing saved working details:", e);
                }
            }
        }
    }, [username]);

    // Save working details to localStorage whenever they change
    useEffect(() => {
        if (username && username !== "Unknown") {
            const storageKey = `workingDetails_${username}`;
            // Only save if there's at least one non-empty value
            const hasContent =
                Object.values(workingDetails).some((v) => v && v.trim() !== "") ||
                Object.values(quantities).some((v) => v && v.trim() !== "");

            if (hasContent) {
                const dataToSave = {
                    details: workingDetails,
                    quantities: quantities,
                };
                localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            } else {
                // Clear storage if all fields are empty
                localStorage.removeItem(storageKey);
            }
        }
    }, [workingDetails, quantities, username]);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format date for display
    const formatDisplayDate = (date) => {
        return date.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Format time for display (12-hour format with seconds)
    const formatDisplayTime = (date) => {
        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });
    };


    // Format date string from ISO/various formats to DD/MM/YYYY
    const formatHistoryDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            // Already in DD/MM/YYYY format
            if (
                typeof dateStr === "string" &&
                /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)
            ) {
                return dateStr;
            }
            // Parse ISO or other date formats
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            return `${day}/${month}/${year}`;
        } catch {
            return dateStr;
        }
    };

    // Filter history data based on name and working details
    const filteredHistory = React.useMemo(() => {
        return historyData.filter((item) => {
            const matchesName =
                filterName === "All" || item.name === filterName;

            const matchesSearch = [
                item.workingDetails,
                item.name,
                item.date,
                item.time,
                item.uniqueNumber,
                item.qty
            ]
                .some(field =>
                    (field || "")
                        .toString()
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                );

            return matchesName && matchesSearch;
        });
    }, [historyData, filterName, searchQuery]);

    // Format time string to HH:MM AM/PM
    const formatHistoryTime = (timeStr) => {
        if (!timeStr) return "-";
        try {
            // If it's an ISO string like "1899-12-30T04:08:50.000Z"
            if (typeof timeStr === "string" && timeStr.includes("T")) {
                const date = new Date(timeStr);
                if (isNaN(date.getTime())) return timeStr;

                // Use local hours/minutes to match the user's timezone exactly
                const hours = date.getHours().toString().padStart(2, "0");
                const minutes = date.getMinutes().toString().padStart(2, "0");
                return `${hours}:${minutes}`;
            }
            return timeStr;
        } catch {
            return timeStr;
        }
    };

    // Format timestamp to DD/MM/YYYY HH:MM
    const formatHistoryTimestamp = (tsStr) => {
        if (!tsStr) return "-";
        try {
            const date = new Date(tsStr);
            if (isNaN(date.getTime())) return tsStr;
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12;
            return `${day}/${month}/${year} ${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
        } catch {
            return tsStr;
        }
    };

    // Simplified: Get the current maximum ID from Supabase
    const getLastUniqueNumber = async () => {
        try {
            const { data, error } = await supabase
                .from("workingdate")
                .select("unique_number")
                .order("unique_number", { ascending: false })
                .limit(1);

            if (error) throw error;

            let maxId = 0;
            if (data && data.length > 0) {
                const lastUniqueNumber = data[0].unique_number;
                if (lastUniqueNumber && lastUniqueNumber.startsWith("W")) {
                    const numStr = lastUniqueNumber.substring(1);
                    const num = parseInt(numStr, 10);
                    if (!isNaN(num)) maxId = num;
                }
            }
            return maxId;
        } catch (error) {
            console.error("Error fetching last unique number from Supabase:", error);
            return 0;
        }
    };

    const fetchHistory = async () => {
        if (!username || username === "Unknown") return;
        setIsLoadingHistory(true);
        try {
            let query = supabase.from("workingdate").select("*");

            // Role-based logic: Admin sees all data, regular users only see their own
            if (userRole !== "admin" && userRole !== "superadmin") {
                query = query.eq("name_of_person", username);
            }

            const { data, error } = await query.order("timestamp", { ascending: false });

            if (error) throw error;

            // Map Supabase columns to UI format
            const formattedData = (data || []).map(row => ({
                timestamp: row.timestamp,
                date: row.date,
                uniqueNumber: row.unique_number,
                name: row.name_of_person,
                time: row.time,
                workingDetails: row.working_details,
                qty: row.qty
            }));

            setHistoryData(formattedData);

            // Populate unique names for filters if admin
            if (userRole === "admin" || userRole === "superadmin") {
                const names = [...new Set(formattedData.map((item) => item.name))]
                    .filter(Boolean)
                    .sort();
                setUniqueNames(names);
            }
        } catch (error) {
            console.error("Error fetching history from Supabase:", error);
            setErrorMessage(`Failed to load history data: ${error.message}`);
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Fetch history when tab changes to history
    useEffect(() => {
        if (activeTab === "history" && username && userRole) {
            fetchHistory();
        }
    }, [activeTab, username, userRole]);

    const formatUniqueNumber = (num) => {
        return `W${num.toString().padStart(3, "0")}`;
    };

    // Handle input change for working details
    const handleInputChange = (time, value) => {
        setWorkingDetails((prev) => ({ ...prev, [time]: value }));
    };

    // Handle input change for quantity
    const handleQuantityChange = (time, value) => {
        setQuantities((prev) => ({ ...prev, [time]: value }));
    };

    // Updated: Supabase batch submission
    const handleSubmit = async () => {
        // Step 1: Filter to get ONLY the slots with data in working details OR quantity
        const filledSlots = timeSlots.filter(
            (time) =>
                (workingDetails[time] && workingDetails[time].trim() !== "") ||
                (quantities[time] && quantities[time].trim() !== ""),
        );

        if (filledSlots.length === 0) {
            setErrorMessage(
                "Please enter at least one working detail or quantity before submitting.",
            );
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const timestamp = new Date().toISOString();
            let currentId = await getLastUniqueNumber();

            // Step 2: Prepare all rows for Supabase insert
            const rowsToSubmit = filledSlots.map((timeSlot) => {
                currentId++;
                const uniqueNumber = formatUniqueNumber(currentId);

                // Convert UI time ("09:30 AM") to DB format ("09:30:00")
                let [time, modifier] = timeSlot.split(' ');
                let [hours, minutes] = time.split(':');
                if (hours === '12' && modifier === 'AM') hours = '00';
                else if (modifier === 'PM' && hours !== '12') hours = String(parseInt(hours, 10) + 12);
                const formattedTime = `${hours.padStart(2, '0')}:${minutes}:00`;

                return {
                    timestamp: timestamp,
                    date: selectedDate, // YYYY-MM-DD
                    unique_number: uniqueNumber,
                    name_of_person: username,
                    time: formattedTime,
                    working_details: workingDetails[timeSlot] || "",
                    qty: String(quantities[timeSlot] || ""),
                };
            });

            // Step 3: Supabase Insert
            const { error } = await supabase.from("workingdate").insert(rowsToSubmit);

            if (error) throw error;

            // Success feedback - clear all form fields
            setWorkingDetails(
                timeSlots.reduce((acc, time) => ({ ...acc, [time]: "" }), {}),
            );
            setQuantities(
                timeSlots.reduce((acc, time) => ({ ...acc, [time]: "" }), {}),
            );

            // Clear localStorage for this user after successful submission
            if (username && username !== "Unknown") {
                localStorage.removeItem(`workingDetails_${username}`);
            }

            setSuccessMessage(
                `Successfully submitted ${rowsToSubmit.length} working detail(s)!`,
            );

            // Immediately refresh history
            if (activeTab === "history") {
                fetchHistory();
            } else {
                // Clear filters when submitting if not on history tab to ensure new data shows up correctly later
                setFilterName("All");
                setSearchQuery("");
            }

            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (error) {
            console.error("Supabase submission error:", error);
            setErrorMessage(`Failed to submit: ${error.message}`);
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Count filled slots
    const filledSlotsCount = Object.values(workingDetails).filter(
        (v) => v && v.trim() !== "",
    ).length;

    // Clear all inputs
    const handleClearAll = () => {
        setWorkingDetails(
            timeSlots.reduce((acc, time) => ({ ...acc, [time]: "" }), {}),
        );
        setQuantities(
            timeSlots.reduce((acc, time) => ({ ...acc, [time]: "" }), {}),
        );
        setSuccessMessage("All fields cleared.");
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Working Date Management
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                            User: {username}
                        </span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab("workingDate")}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === "workingDate"
                            ? "bg-white text-blue-600 shadow-md"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                            }`}
                    >
                        <Calendar className="h-4 w-4" />
                        Working Date
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === "history"
                            ? "bg-white text-blue-600 shadow-md"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                            }`}
                    >
                        <Clock className="h-4 w-4" />
                        History
                    </button>
                </div>

                {/* Floating Toast Notifications */}
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 space-y-3 pointer-events-none">
                    {successMessage && (
                        <div className="pointer-events-auto bg-white border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">Success</span>
                                <span className="text-xs opacity-90">{successMessage}</span>
                            </div>
                        </div>
                    )}
                    {errorMessage && (
                        <div className="pointer-events-auto bg-white border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">Error</span>
                                <span className="text-xs opacity-90">{errorMessage}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    {activeTab === "workingDate" && (
                        <div>
                            {/* Header Section */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex flex-col lg:flex-row gap-6 items-start">
                                    {/* Current Date & Time Display Card */}
                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg w-full lg:w-auto lg:min-w-[280px]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CalendarDays className="h-4 w-4 opacity-80" />
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                                                Current Date & Time
                                            </span>
                                            <span className="ml-auto flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                                <span className="text-xs font-bold opacity-70">
                                                    Live
                                                </span>
                                            </span>
                                        </div>
                                        <p className="text-lg font-bold opacity-95 mb-1">
                                            {formatDisplayDate(currentDateTime)}
                                        </p>
                                        <p className="text-3xl font-extrabold tracking-wide font-mono">
                                            {formatDisplayTime(currentDateTime)}
                                        </p>
                                    </div>

                                    {/* Date Details Card - Editable */}
                                    <div className="flex-1 w-full lg:w-auto">
                                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 h-full">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Date Details
                                                </h3>
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">
                                                    Editable
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 mb-2 block">
                                                        Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={selectedDate}
                                                        onChange={(e) => setSelectedDate(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-base font-bold text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 mb-2 block">
                                                        Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={selectedTime}
                                                        onChange={(e) => setSelectedTime(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-base font-bold text-gray-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-3 italic">
                                                Select the date and time for your working details
                                                submission
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Time Slots Table */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Daily Schedule
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        {filledSlotsCount > 0 && (
                                            <span className="text-xs text-blue-600 font-bold">
                                                {filledSlotsCount} slot(s) filled
                                            </span>
                                        )}
                                        <button
                                            onClick={handleClearAll}
                                            disabled={filledSlotsCount === 0}
                                            className={`text-xs px-3 py-1 rounded font-bold transition-all duration-200 ${filledSlotsCount === 0
                                                ? "text-gray-400 cursor-not-allowed"
                                                : "text-red-600 hover:text-red-800 hover:bg-red-50"
                                                }`}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
                                    {/* Table Header - Hidden on Mobile */}
                                    <div className="hidden md:grid md:grid-cols-[140px_1fr_400px] bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                                        <div className="px-5 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                                            Time Slot
                                        </div>
                                        <div className="px-5 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                                            Working Details
                                        </div>
                                        <div className="px-5 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Quantity
                                        </div>
                                    </div>

                                    {/* Table Body */}
                                    <div className="divide-y divide-gray-100 mb-10">
                                        {timeSlots.map((time, index) => (
                                            <div
                                                key={index}
                                                className={`grid grid-cols-1 md:grid-cols-[140px_1fr_400px] transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                                    } hover:bg-blue-50/50 p-4 md:p-0`}
                                            >
                                                <div className="px-0 md:px-5 py-2 md:py-4 flex items-center gap-3 md:border-r border-gray-100">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${workingDetails[time].trim() ? "bg-green-100" : "bg-blue-100"}`}
                                                    >
                                                        <Clock
                                                            className={`h-4 w-4 ${workingDetails[time].trim() ? "text-green-600" : "text-blue-600"}`}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700">
                                                        {time}
                                                    </span>
                                                </div>
                                                <div className="px-0 md:px-5 py-2 md:py-3 flex items-center md:border-r border-gray-100">
                                                    <div className="w-full">
                                                        <label className="block md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1">Working Details</label>
                                                        <input
                                                            type="text"
                                                            value={workingDetails[time]}
                                                            onChange={(e) =>
                                                                handleInputChange(time, e.target.value)
                                                            }
                                                            placeholder="Add notes for this slot..."
                                                            className="w-full px-4 py-2.5 bg-slate-50/50 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-800 placeholder:text-slate-400/70 transition-all duration-300 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 hover:border-slate-400 hover:bg-slate-50 shadow-sm focus:shadow-md"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="px-0 md:px-5 py-2 md:py-3 flex items-center">
                                                    <div className="w-full">
                                                        <label className="block md:hidden text-[10px] font-bold text-gray-400 uppercase mb-1">Quantity</label>
                                                        <input
                                                            type="text"
                                                            value={quantities[time]}
                                                            onChange={(e) =>
                                                                handleQuantityChange(time, e.target.value)
                                                            }
                                                            placeholder="PLEASE QUANTIFY THE YOUR WORK U HAVE DONE FOR EXAMPLE IF YOU MADE JCC IN THAT HOUR"
                                                            className="w-full px-4 py-2.5 bg-slate-50/50 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-800 placeholder:text-[9px] placeholder:font-bold placeholder:text-slate-400/90 transition-all duration-300 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 hover:border-slate-400 hover:bg-slate-50 shadow-sm focus:shadow-md text-center md:text-left"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Floating Submit Button */}
                                <div className="fixed bottom-24 right-6 md:bottom-10 md:right-8 z-[60]">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || filledSlotsCount === 0}
                                        className={`group flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 ${isSubmitting || filledSlotsCount === 0
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                            : "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white hover:shadow-blue-500/40 ring-4 ring-white shadow-xl"
                                            }`}
                                    >
                                        <div className="relative">
                                            {isSubmitting ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            )}
                                            {filledSlotsCount > 0 && !isSubmitting && (
                                                <span className="absolute -top-6 -right-4 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white animate-bounce shadow-lg">
                                                    {filledSlotsCount}
                                                </span>
                                            )}
                                        </div>
                                        <span>
                                            {isSubmitting
                                                ? "Submitting..."
                                                : "Submit Working Details"}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "history" && (
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        Submission History
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        View previous working date submissions
                                    </p>
                                </div>

                                {/* Filters Section */}
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    {(userRole === "admin" || userRole === "superadmin") && (
                                        <div className="w-full sm:w-48">
                                            <select
                                                value={filterName}
                                                onChange={(e) => setFilterName(e.target.value)}
                                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                                            >
                                                <option value="All">All Persons</option>
                                                {uniqueNames.map((name) => (
                                                    <option key={name} value={name}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="w-full sm:w-64 relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search details..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-11 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={fetchHistory}
                                        disabled={isLoadingHistory}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
                                    >
                                        {isLoadingHistory ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Clock className="h-4 w-4" />
                                        )}
                                        {isLoadingHistory ? "Refreshing..." : "Refresh"}
                                    </button>
                                </div>
                            </div>

                            {isLoadingHistory ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-500" />
                                    <p className="font-bold text-gray-600">
                                        Loading your history...
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Fetching data from WorkingDate sheet
                                    </p>
                                </div>
                            ) : historyData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
                                    <div className="relative mb-4">
                                        <Clock className="h-16 w-16 text-blue-300" />
                                        <div className="absolute -top-2 -right-2 bg-blue-100 p-2 rounded-full">
                                            <AlertCircle className="h-6 w-6 text-blue-500" />
                                        </div>
                                    </div>
                                    <p className="text-gray-700 font-bold text-lg mb-2">
                                        No history found
                                    </p>
                                    <p className="text-gray-500 text-center max-w-md mb-6">
                                        No submissions found for{" "}
                                        <span className="font-bold text-blue-600">{username}</span>.
                                        Start by submitting your first working details.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab("workingDate")}
                                        className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                                    >
                                        <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        Go to Working Date
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block h-[350px] overflow-y-auto overflow-x-auto">
                                        <table className="w-full text-left">

                                            <thead className="bg-gradient-to-r from-gray-50 to-blue-50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        Time
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        ID
                                                    </th>
                                                    {(userRole === "admin" || userRole === "superadmin") && (
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                            Person Name
                                                        </th>
                                                    )}
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        Working Details
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        Quantity
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        Submitted
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredHistory.map((item, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-gray-900">
                                                                {formatHistoryDate(item.date)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-4 w-4 text-gray-400" />
                                                                <span className="text-sm font-bold text-blue-600">
                                                                    {formatHistoryTime(item.time)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                                                {item.uniqueNumber}
                                                            </span>
                                                        </td>
                                                        {(userRole === "admin" || userRole === "superadmin") && (
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-bold text-gray-800">
                                                                    {item.name}
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4">
                                                            <div
                                                                className="text-sm text-gray-800 max-w-xs truncate"
                                                                title={item.details}
                                                            >
                                                                {item.workingDetails}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-indigo-600">
                                                                {item.qty || "-"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-xs text-gray-500">
                                                                {formatHistoryTimestamp(item.timestamp)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden divide-y divide-gray-100">
                                        {filteredHistory.map((item, idx) => (
                                            <div key={idx} className="p-4 space-y-3 bg-white">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-400 uppercase leading-none mb-1">Date & Time</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-gray-900">{formatHistoryDate(item.date)}</span>
                                                            <span className="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded">
                                                                <Clock className="h-3 w-3" />
                                                                {formatHistoryTime(item.time)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded flex-shrink-0 text-[10px] font-bold bg-blue-100 text-blue-800 shadow-sm">
                                                            {item.uniqueNumber}
                                                        </span>
                                                        {(userRole === "admin" || userRole === "superadmin") && (
                                                            <span className="text-[10px] font-bold text-blue-600 truncate max-w-[100px]">
                                                                {item.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Working Details</span>
                                                    <p className="text-sm text-gray-800 font-medium leading-tight">{item.workingDetails || "No details provided"}</p>
                                                </div>

                                                <div className="flex justify-between items-end pt-1">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Quantity</span>
                                                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 italic">
                                                            {item.qty || "-"}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Submitted On</span>
                                                        <span className="text-[10px] text-gray-500 font-bold italic">{formatHistoryTimestamp(item.timestamp)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                        <div className="text-xs font-bold text-gray-500">
                                            {filterName !== "All" || searchQuery !== "" ? (
                                                <span>Filtered: <span className="text-blue-600">{filteredHistory.length}</span> of {historyData.length} entries</span>
                                            ) : (
                                                <span>Total: <span className="text-blue-600">{historyData.length}</span> entries</span>
                                            )}
                                        </div>
                                        <div className="text-xs font-bold text-gray-400 italic">
                                            {userRole === "admin" ? "Admin Access" : `User: ${username}`}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

export default WorkingDate;