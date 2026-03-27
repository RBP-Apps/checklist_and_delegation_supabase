"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { CheckCircle2, Upload, X, Search, History, ArrowLeft } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"
import { useDispatch, useSelector } from "react-redux"
import { checklistData, checklistHistoryData, updateChecklist } from "../../redux/slice/checklistSlice"
import { postChecklistAdminDoneAPI } from "../../redux/api/checkListApi"
import { uniqueDoerNameData } from "../../redux/slice/assignTaskSlice";
import { useNavigate } from "react-router-dom"
import Modal from "../../components/common/Modal"
import supabase from "../../SupabaseClient"

// Configuration object - Move all configurations here
const CONFIG = {
  PAGE_CONFIG: {
    title: "Checklist Tasks",
    historyTitle: "Checklist Task History",
    description: "Showing today's and upcoming tasks",
    historyDescription: "Read-only view of completed tasks with submission history (excluding admin-processed items)",
  },
}

function AccountDataPage() {


  const [accountData, setAccountData] = useState([])
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [additionalData, setAdditionalData] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState(null)
  const [remarksData, setRemarksData] = useState({})
  const [historyData, setHistoryData] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const [currentPageHistory, setCurrentPageHistory] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [initialHistoryLoading, setInitialHistoryLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false);
  const [statusLabelFilter, setStatusLabelFilter] = useState("all");
  const [supabaseUsers, setSupabaseUsers] = useState([]);

  const { checklist, loading, history, hasMore, currentPage } = useSelector((state) => state.checkList);
  const dispatch = useDispatch();

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const tableContainerRef = useRef(null);
  const historyTableContainerRef = useRef(null);

  const { doerName } = useSelector((state) => state.assignTask)

  console.log(doerName)

  useEffect(() => {
    dispatch(checklistData({ page: 1, searchTerm: '', statusFilter: 'all' }))
    dispatch(checklistHistoryData(1))
    dispatch(uniqueDoerNameData());

    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('user_name')
        .order('user_name', { ascending: true });
      if (data) {
        const uniqueNames = [...new Set(data.map(u => u.user_name))].filter(Boolean);
        setSupabaseUsers(uniqueNames);
      }
    };
    fetchUsers();
  }, [dispatch])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounce filter updates (removed searchTerm to prevent API overriding client-side search)
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(checklistData({
        page: 1,
        searchTerm: '', // Keep empty as we search client-side
        statusFilter: statusLabelFilter
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [statusLabelFilter, dispatch]);

  const handleScrollPending = useCallback(() => {
    if (!tableContainerRef.current || loading || isFetchingMore || !hasMore || checklist.length === 0) return

    const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100

    if (isNearBottom) {
      setIsFetchingMore(true)
      dispatch(checklistData({
        page: currentPage + 1,
        searchTerm,
        statusFilter: statusLabelFilter
      }))
        .finally(() => setIsFetchingMore(false))
    }
  }, [loading, isFetchingMore, hasMore, currentPage, dispatch, checklist.length, searchTerm, statusLabelFilter])

  // Handle scroll for history
  const handleScrollHistory = useCallback(() => {
    if (!historyTableContainerRef.current || isLoadingMoreHistory || !hasMoreHistory || history.length === 0) return

    const { scrollTop, scrollHeight, clientHeight } = historyTableContainerRef.current
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100

    if (isNearBottom) {
      setIsLoadingMoreHistory(true)
      dispatch(checklistHistoryData(currentPageHistory + 1))
        .then((result) => {
          if (result.payload && result.payload.length < 50) {
            setHasMoreHistory(false)
          }
          setCurrentPageHistory(prev => prev + 1)
        })
        .finally(() => setIsLoadingMoreHistory(false))
    }
  }, [isLoadingMoreHistory, hasMoreHistory, currentPageHistory, dispatch, history.length])

  // Add scroll event listener
  useEffect(() => {
    const tableElement = tableContainerRef.current
    if (tableElement && !showHistory) {
      tableElement.addEventListener('scroll', handleScrollPending)
      return () => tableElement.removeEventListener('scroll', handleScrollPending)
    }
  }, [handleScrollPending, showHistory])

  useEffect(() => {
    const historyTableElement = historyTableContainerRef.current
    if (historyTableElement && showHistory) {
      historyTableElement.addEventListener('scroll', handleScrollHistory)
      return () => historyTableElement.removeEventListener('scroll', handleScrollHistory)
    }
  }, [handleScrollHistory, showHistory])


  const ITEMS_PER_PAGE = 100;

  // NEW: Admin history selection states
  const [selectedHistoryItems, setSelectedHistoryItems] = useState([])
  const [markingAsDone, setMarkingAsDone] = useState(false)
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    itemCount: 0,
  })

  // UPDATED: Format date-time to DD/MM/YYYY HH:MM:SS
  const formatDateTimeToDDMMYYYY = (date) => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }

  // UPDATED: Format date only to DD/MM/YYYY (for comparison purposes)
  const formatDateToDDMMYYYY = (date) => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const isEmpty = (value) => {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "")
  }

  useEffect(() => {
    const role = localStorage.getItem("role")
    const user = localStorage.getItem("username")
    setUserRole(role || "")
    setUsername(user || "")
  }, [])

  // Load initial history data when showing history
  useEffect(() => {
    if (showHistory && history.length === 0) {
      setInitialHistoryLoading(true)
      dispatch(checklistHistoryData(1))
        .then((result) => {
          if (result.payload && result.payload.length < 50) {
            setHasMoreHistory(false)
          }
        })
        .finally(() => setInitialHistoryLoading(false))
    }
  }, [showHistory, history.length, dispatch])

  // UPDATED: Parse Google Sheets date-time to handle DD/MM/YYYY HH:MM:SS format
  const parseGoogleSheetsDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return ""
    // If already in DD/MM/YYYY HH:MM:SS format, return as is
    if (typeof dateTimeStr === "string" && dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) {
      return dateTimeStr
    }
    // If in DD/MM/YYYY format (without time), return as is
    if (typeof dateTimeStr === "string" && dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateTimeStr
    }
    // Handle Google Sheets Date(year,month,day) format
    if (typeof dateTimeStr === "string" && dateTimeStr.startsWith("Date(")) {
      const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateTimeStr)
      if (match) {
        const year = Number.parseInt(match[1], 10)
        const month = Number.parseInt(match[2], 10)
        const day = Number.parseInt(match[3], 10)
        return `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`
      }
    }
    // Try to parse as a regular date
    try {
      const date = new Date(dateTimeStr)
      if (!isNaN(date.getTime())) {
        // Check if the original string contained time information
        if (typeof dateTimeStr === "string" && (dateTimeStr.includes(":") || dateTimeStr.includes("T"))) {
          return formatDateTimeToDDMMYYYY(date)
        } else {
          return formatDateToDDMMYYYY(date)
        }
      }
    } catch (error) {
      console.error("Error parsing date-time:", error)
    }
    return dateTimeStr
  }

  // UPDATED: Parse date from DD/MM/YYYY or DD/MM/YYYY HH:MM:SS format for comparison
  const parseDateFromDDMMYYYY = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;

    const [datePart] = dateStr.split(" ");
    const parts = datePart.split("/");

    if (parts.length !== 3) return null;

    return new Date(parts[2], parts[1] - 1, parts[0]); // yyyy, mm (0-indexed), dd
  };



  const sortDateWise = (a, b) => {
    // For current data structure, use task_start_date instead of col6
    const dateStrA = a.task_start_date || ""
    const dateStrB = b.task_start_date || ""

    const dateA = new Date(dateStrA)
    const dateB = new Date(dateStrB)

    if (!dateA || isNaN(dateA.getTime())) return 1
    if (!dateB || isNaN(dateB.getTime())) return -1

    return dateA.getTime() - dateB.getTime()
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedMembers([])
    setStartDate("")
    setEndDate("")
  }

  // NEW: Admin functions for history management
  const handleMarkMultipleDone = async () => {
    if (selectedHistoryItems.length === 0) {
      return
    }
    if (markingAsDone) return

    // Open confirmation modal
    setConfirmationModal({
      isOpen: true,
      itemCount: selectedHistoryItems.length,
    })
  }

  // NEW: Confirmation modal component
  const ConfirmationModal = ({ isOpen, itemCount, onConfirm, onCancel }) => {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onCancel}
        title="Mark Items as Done"
        maxWidth="sm:max-w-md"
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-yellow-100 text-yellow-600 rounded-full p-3 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <p className="text-gray-600 text-center mb-6 text-sm sm:text-base">
            Are you sure you want to mark {itemCount} {itemCount === 1 ? "item" : "items"} as done?
          </p>

          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  const parseSupabaseDate = (dateStr) => {
    if (!dateStr) return null;

    // Handle ISO string from Supabase
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      return new Date(dateStr);
    }

    // Handle already parsed Date objects
    if (dateStr instanceof Date) {
      return dateStr;
    }

    // Fallback for other formats
    return new Date(dateStr);
  };

  // UPDATED: Confirmation handler - Don't remove items from UI, just update their status
  const confirmMarkDone = async () => {
    setConfirmationModal({ isOpen: false, itemCount: 0 });
    setMarkingAsDone(true);
    console.log(selectedHistoryItems);
    try {
      const { data, error } = await postChecklistAdminDoneAPI(selectedHistoryItems);

      if (error) {
        throw new Error(error.message || "Failed to mark items as done");
      }

      // Clear selected items
      setSelectedHistoryItems([]);

      // Refresh data
      dispatch(checklistHistoryData());

      setSuccessMessage(
        `Successfully marked ${selectedHistoryItems.length} items as admin processed!`
      );
    } catch (error) {
      console.error("Error marking tasks as done:", error);
      setSuccessMessage(`Failed to mark tasks as done: ${error.message}`);
    } finally {
      setMarkingAsDone(false);
    }
  };

  // Filtered data for pending tasks
  const filteredAccountData = useMemo(() => {
    if (!Array.isArray(checklist)) return [];

    let filtered = checklist;

    // Apply search filter across all columns
    if (searchTerm) {
      filtered = filtered.filter((account) =>
        Object.values(account).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // NEW: Apply member filter
    if (selectedMembers.length > 0) {
      filtered = filtered.filter((account) =>
        selectedMembers.includes(account.name)
      );
    }

    return filtered;

  }, [checklist, searchTerm, selectedMembers]);

  const filteredHistoryData = useMemo(() => {
    if (!Array.isArray(history)) return []

    const filtered = history
      .filter((item) => {
        // Search filter
        const matchesSearch = searchTerm
          ? Object.entries(item).some(([key, value]) => {
            if (['image', 'admin_done'].includes(key)) return false
            return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          })
          : true

        // Member filter
        const matchesMember = selectedMembers.length > 0
          ? selectedMembers.includes(item.name)
          : true

        // Date range filter
        let matchesDateRange = true

        if (startDate || endDate) {
          const itemDate = parseSupabaseDate(item.task_start_date)
          if (!itemDate || isNaN(itemDate.getTime())) return false

          // Normalize to start of day for comparison
          const itemDateOnly = new Date(
            itemDate.getFullYear(),
            itemDate.getMonth(),
            itemDate.getDate()
          )

          // Create comparison dates
          const start = startDate ? new Date(startDate) : null
          if (start) start.setHours(0, 0, 0, 0)

          const end = endDate ? new Date(endDate) : null
          if (end) {
            end.setHours(23, 59, 59, 999) // End of day
          }

          // Compare dates
          if (start && itemDateOnly < start) matchesDateRange = false
          if (end && itemDateOnly > end) matchesDateRange = false
        }

        return matchesSearch && matchesMember && matchesDateRange
      })
      .sort((a, b) => {
        const dateA = parseSupabaseDate(a.task_start_date)
        const dateB = parseSupabaseDate(b.task_start_date)
        if (!dateA) return 1
        if (!dateB) return -1
        return dateB - dateA // Sort newest first
      })

    // Return only the items for current page
    return filtered.slice(0, currentPageHistory * 50) // 50 items per page
  }, [history, searchTerm, selectedMembers, startDate, endDate, currentPageHistory])


  const getTaskStatistics = () => {
    const totalCompleted = history.length
    const memberStats =
      selectedMembers.length > 0
        ? selectedMembers.reduce((stats, member) => {
          const memberTasks = history.filter((task) => task.name === member).length
          return {
            ...stats,
            [member]: memberTasks,
          }
        }, {})
        : {}
    const filteredTotal = filteredHistoryData.length
    return {
      totalCompleted,
      memberStats,
      filteredTotal,
    }
  }

  const handleMemberSelection = (member) => {
    setSelectedMembers((prev) => {
      if (prev.includes(member)) {
        return prev.filter((item) => item !== member)
      } else {
        return [...prev, member]
      }
    })
  }

  const getFilteredMembersList = () => {
    if (userRole === "admin") {
      // Use users from Supabase users table if available, fallback to active names from data
      if (supabaseUsers.length > 0) {
        return supabaseUsers;
      }

      // Fallback logic (original)
      const checklistNames = Array.isArray(checklist) ? checklist.map(item => item.name) : [];
      const historyNames = Array.isArray(history) ? history.map(item => item.name) : [];
      const activeNames = [...new Set([...checklistNames, ...historyNames])]
        .filter(name => name && name.trim() !== "");
      return activeNames.sort((a, b) => a.localeCompare(b));
    } else {
      return [username].filter(member => member && member.trim() !== "");
    }
  }

  const fetchSheetData = useCallback(async () => {
    try {
      const pendingAccounts = []
      const historyRows = []

      const currentUsername = localStorage.getItem("username")
      const currentUserRole = localStorage.getItem("role")
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const todayStr = formatDateToDDMMYYYY(today)
      const tomorrowStr = formatDateToDDMMYYYY(tomorrow)
      console.log("Filtering dates:", { todayStr, tomorrowStr })

      const membersSet = new Set()
      let rows = []

      setAccountData(checklist)
      setHistoryData(history)
    } catch (error) {
      console.error("Error fetching sheet data:", error)
      setError("Failed to load account data: " + error.message)
    }
  }, [])

  // Checkbox handlers with better state management
  const handleSelectItem = useCallback((id, isChecked) => {
    console.log(`Checkbox action: ${id} -> ${isChecked}`)
    setSelectedItems((prev) => {
      const newSelected = new Set(prev)
      if (isChecked) {
        newSelected.add(id)
      } else {
        newSelected.delete(id)
        // Clean up related data when unchecking
        setAdditionalData((prevData) => {
          const newAdditionalData = { ...prevData }
          delete newAdditionalData[id]
          return newAdditionalData
        })
        setRemarksData((prevRemarks) => {
          const newRemarksData = { ...prevRemarks }
          delete newRemarksData[id]
          return newRemarksData
        })
      }
      console.log(`Updated selection: ${Array.from(newSelected)}`)
      return newSelected
    })
  }, [])

  const handleCheckboxClick = useCallback(
    (e, id) => {
      e.stopPropagation()
      const isChecked = e.target.checked
      console.log(`Checkbox clicked: ${id}, checked: ${isChecked}`)
      handleSelectItem(id, isChecked)
    },
    [handleSelectItem],
  )

  const handleSelectAllItems = useCallback(
    (e) => {
      e.stopPropagation()
      const checked = e.target.checked
      console.log(`Select all clicked: ${checked}`)
      if (checked) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allIds = filteredAccountData
          .filter(item => {
            if (!item.task_start_date) return true;
            const taskDate = new Date(item.task_start_date);
            const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
            return taskDateOnly <= today; // Only select if not upcoming
          })
          .map((item) => item.task_id)

        setSelectedItems(new Set(allIds))
        console.log(`Selected all items (excluding upcoming): ${allIds}`)
      } else {
        setSelectedItems(new Set())
        setAdditionalData({})
        setRemarksData({})
        console.log("Cleared all selections")
      }
    },
    [filteredAccountData],
  )

  const [uploadedImages, setUploadedImages] = useState({});

  // Update the handleImageUpload function
  const handleImageUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create a preview URL for the image
    const previewUrl = URL.createObjectURL(file);

    // Update the uploadedImages state
    setUploadedImages(prev => ({
      ...prev,
      [id]: {
        file,
        previewUrl
      }
    }));

    // Also update the accountData if needed
    setAccountData(prev =>
      prev.map(item =>
        item.task_id === id
          ? { ...item, image: file }
          : item
      )
    );
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const toggleHistory = () => {
    setShowHistory((prev) => !prev)
    resetFilters()
  }

  useEffect(() => {
    setCurrentPagePending(1);
    setCurrentPageHistory(1);
  }, [searchTerm, selectedMembers, startDate, endDate, showHistory]);

  const LoadingIndicator = () => (
    <div className="text-center py-4 bg-gray-50">
      {isLoadingMore ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mr-2"></div>
          <span className="text-purple-600 text-sm">Loading more items...</span>
        </div>
      ) : null}
    </div>
  );


  const hasMoreItems = () => {
    if (showHistory) {
      const totalFilteredItems = history.filter((item) => {
        // Apply same filters as in filteredHistoryData
        const matchesSearch = searchTerm
          ? Object.entries(item).some(([key, value]) => {
            if (['image', 'admin_done'].includes(key)) return false;
            return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
          })
          : true;

        const matchesMember = selectedMembers.length > 0
          ? selectedMembers.includes(item.name)
          : true;

        let matchesDateRange = true;
        if (startDate || endDate) {
          const itemDate = parseSupabaseDate(item.task_start_date);
          if (!itemDate || isNaN(itemDate.getTime())) return false;

          const itemDateOnly = new Date(
            itemDate.getFullYear(),
            itemDate.getMonth(),
            itemDate.getDate()
          );

          const start = startDate ? new Date(startDate) : null;
          if (start) start.setHours(0, 0, 0, 0);

          const end = endDate ? new Date(endDate) : null;
          if (end) end.setHours(23, 59, 59, 999);

          if (start && itemDateOnly < start) matchesDateRange = false;
          if (end && itemDateOnly > end) matchesDateRange = false;
        }

        return matchesSearch && matchesMember && matchesDateRange;
      }).length;

      return currentPageHistory * ITEMS_PER_PAGE < totalFilteredItems;
    } else {
      const totalFilteredItems = checklist.filter((account) =>
        searchTerm
          ? Object.values(account).some(
            (value) =>
              value &&
              value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
          : true
      ).length;

      return currentPagePending * ITEMS_PER_PAGE < totalFilteredItems;
    }
  };



  // UPDATED: MAIN SUBMIT FUNCTION with date-time formatting
  const handleSubmit = async () => {
    const selectedItemsArray = Array.from(selectedItems);
    if (selectedItemsArray.length === 0) {
      alert("Please select at least one item to submit");
      return;
    }

    // NEW: Check if all selected items have status selected
    const missingStatus = selectedItemsArray.filter((id) => {
      const status = additionalData[id];
      return !status || status === ""; // Status is empty or not selected
    });

    if (missingStatus.length > 0) {
      alert(`Please select status (yes/no) for all selected tasks. ${missingStatus.length} item(s) are missing status selection.\n\nकृपया सभी चयनित कार्यों के लिए स्थिति (हाँ/नहीं) चुनें। ${missingStatus.length} आइटम स्थिति चयन से छूट गए हैं।`);
      return;
    }

    // Check for missing remarks (only for items with status "no")
    const missingRemarks = selectedItemsArray.filter((id) => {
      const additionalStatus = additionalData[id];
      const remarks = remarksData[id];
      return additionalStatus === "no" && (!remarks || remarks.trim() === "");
    });

    if (missingRemarks.length > 0) {
      alert(`Please provide remarks for items marked as "no". ${missingRemarks.length} item(s) are missing remarks.\n\nकृपया "नहीं" चिह्नित आइटमों के लिए टिप्पणियाँ प्रदान करें। ${missingRemarks.length} आइटम टिप्पणियों से छूट गए हैं।`);
      return;
    }

    // Check for missing required images (only if status is not "no")
    const missingRequiredImages = selectedItemsArray.filter((id) => {
      const item = checklist.find((account) => account.task_id === id);
      const requiresAttachment = item.require_attachment && item.require_attachment.toUpperCase() === "yes";
      const hasImage = uploadedImages[id] || item.image;
      const statusIsNo = additionalData[id] === "no";

      // Only require image if attachment is required AND status is not "no"
      return requiresAttachment && !hasImage && !statusIsNo;
    });

    if (missingRequiredImages.length > 0) {
      alert(
        `Please upload images for all required attachments. ${missingRequiredImages.length} item(s) are missing required images.`,
      );
      return;
    }

    setIsSubmitting(true);

    // Prepare the submission data
    const submissionData = selectedItemsArray.map((id) => {
      const item = checklist.find((account) => account.task_id === id);
      const imageData = uploadedImages[id];

      return {
        taskId: item.task_id,
        department: item.department,
        givenBy: item.given_by,
        name: item.name,
        taskDescription: item.task_description,
        taskStartDate: item.task_start_date,
        frequency: item.frequency,
        enableReminder: item.enable_reminder,
        requireAttachment: item.require_attachment,
        status: additionalData[id] || "",
        remarks: remarksData[id] || "",
        image: imageData ? {
          name: imageData.file.name,
          type: imageData.file.type,
          size: imageData.file.size,
          previewUrl: imageData.previewUrl
        } : item.image ? {
          existingImage: typeof item.image === 'string' ? item.image : 'File object'
        } : null
      };
    });

    try {
      console.log("Dispatching updateChecklist with data:", submissionData);
      await dispatch(updateChecklist(submissionData)).unwrap();

      setSuccessMessage(`Successfully updated ${selectedItemsArray.length} tasks!`);

      // Clear selections after submission
      setSelectedItems(new Set());
      setAdditionalData({});
      setRemarksData({});
      setUploadedImages({});

      // Refresh the page after showing success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Submission failed:", err);
      alert(`Submission failed: ${err.message || 'Unknown error'}`);
      setIsSubmitting(false);
    }
  };

  // Convert Set to Array for display
  const selectedItemsCount = selectedItems.size

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
        <div className="flex flex-col gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-purple-700">
            {showHistory ? CONFIG.PAGE_CONFIG.historyTitle : CONFIG.PAGE_CONFIG.title}
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={showHistory ? "Search history..." : "Search tasks..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              />
            </div>
            {!showHistory && (
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative w-full sm:w-48">
                  <select
                    value={statusLabelFilter}
                    onChange={(e) => setStatusLabelFilter(e.target.value)}
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

                <div className="relative w-full sm:w-48">
                  <select
                    value={selectedMembers.length > 0 ? selectedMembers[0] : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setSelectedMembers([val]);
                      } else {
                        setSelectedMembers([]);
                      }
                    }}
                    className="w-full appearance-none bg-white border border-purple-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base pr-10"
                  >
                    <option value="">All Names</option>
                    {getFilteredMembersList().map((member, idx) => (
                      <option key={idx} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-purple-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
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
                  disabled={selectedItemsCount === 0 || isSubmitting}
                  className="flex-1 sm:flex-none rounded-md gradient-bg py-2 px-3 sm:px-4 text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSubmitting ? "Processing..." : (
                    <>
                      <span className="hidden sm:inline">Submit Selected ({selectedItemsCount})</span>
                      <span className="sm:hidden">Submit ({selectedItemsCount})</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* NEW: Admin Submit Button for History View */}
            {showHistory && userRole === "admin" && selectedHistoryItems.length > 0 && (
              <div className="fixed bottom-4 right-4 sm:top-40 sm:bottom-auto sm:right-10 z-50">
                <button
                  onClick={handleMarkMultipleDone}
                  disabled={markingAsDone}
                  className="rounded-md bg-green-600 text-white px-3 sm:px-4 py-2 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm sm:text-base"
                >
                  {markingAsDone ? "Processing..." : (
                    <>
                      <span className="hidden sm:inline">Mark {selectedHistoryItems.length} Items as Done</span>
                      <span className="sm:hidden">Mark Done ({selectedHistoryItems.length})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

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

        <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-3 sm:p-4">
            <h2 className="text-purple-700 font-medium text-sm sm:text-base">
              {showHistory ? `Completed ${CONFIG.SHEET_NAME} Tasks` : `Pending Checklist Tasks`}
            </h2>
            <p className="text-purple-600 text-xs sm:text-sm mt-1">
              {showHistory
                ? `${CONFIG.PAGE_CONFIG.historyDescription} for ${userRole === "admin" ? "all" : "your"} tasks`
                : CONFIG.PAGE_CONFIG.description}
            </p>
          </div>

          {loading && (showHistory ? currentPageHistory === 1 : currentPage === 1) ? (
            // Full table loading for initial load
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-purple-600 text-sm sm:text-base">Loading task data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800 text-center text-sm sm:text-base">
              {error}{" "}
              <button className="underline ml-2" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          ) : showHistory ? (
            <>
              {/* History Filters */}
              <div className="p-3 sm:p-4 border-b border-purple-100 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-end gap-3 sm:gap-4">
                  {getFilteredMembersList().length > 0 && (
                    <div className="flex flex-col">
                      <div className="mb-2 flex items-center">
                        <span className="text-xs sm:text-sm font-medium text-purple-700">Filter by Member:</span>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <select
                          className="w-full appearance-none bg-white border border-gray-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base pr-10"
                          value={selectedMembers.length > 0 ? selectedMembers[0] : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              setSelectedMembers([val]);
                            } else {
                              setSelectedMembers([]);
                            }
                          }}
                        >
                          <option value="">All Members</option>
                          {getFilteredMembersList().map((member, idx) => (
                            <option key={idx} value={member}>
                              {member}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-purple-500">
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="mb-2 flex items-center">
                      <span className="text-xs sm:text-sm font-medium text-purple-700">Filter by Date Range:</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <div className="flex items-center w-full sm:w-auto">
                        <label htmlFor="start-date" className="text-xs sm:text-sm text-gray-700 mr-1 whitespace-nowrap">
                          From
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                          }}
                          className="text-xs sm:text-sm border border-gray-200 rounded-md p-2 flex-1 sm:flex-none"
                        />
                      </div>
                      <div className="flex items-center w-full sm:w-auto">
                        <label htmlFor="end-date" className="text-xs sm:text-sm text-gray-700 mr-1 whitespace-nowrap">
                          To
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                          }}
                          className="text-xs sm:text-sm border border-gray-200 rounded-md p-2 flex-1 sm:flex-none"
                        />
                      </div>
                    </div>
                  </div>
                  {(selectedMembers.length > 0 || startDate || endDate || searchTerm) && (
                    <button
                      onClick={resetFilters}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-xs sm:text-sm w-full sm:w-auto mb-[2px] h-[38px] sm:h-[42px]"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>

              {/* NEW: Confirmation Modal */}
              <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                itemCount={confirmationModal.itemCount}
                onConfirm={confirmMarkDone}
                onCancel={() => setConfirmationModal({ isOpen: false, itemCount: 0 })}
              />

              {/* Task Statistics */}
              <div className="p-3 sm:p-4 border-b border-purple-100 bg-blue-50">
                <div className="flex flex-col">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-700 mb-2">Task Completion Statistics:</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <div className="px-2 sm:px-3 py-2 bg-white rounded-md shadow-sm">
                      <span className="text-xs text-gray-500">Total Completed</span>
                      <div className="text-base sm:text-lg font-semibold text-blue-600">{getTaskStatistics().totalCompleted}</div>
                    </div>
                    {(selectedMembers.length > 0 || startDate || endDate || searchTerm) && (
                      <div className="px-2 sm:px-3 py-2 bg-white rounded-md shadow-sm">
                        <span className="text-xs text-gray-500">Filtered Results</span>
                        <div className="text-base sm:text-lg font-semibold text-blue-600">{getTaskStatistics().filteredTotal}</div>
                      </div>
                    )}
                    {selectedMembers.map((member) => (
                      <div key={member} className="px-2 sm:px-3 py-2 bg-white rounded-md shadow-sm">
                        <span className="text-xs text-gray-500">{member}</span>
                        <div className="text-base sm:text-lg font-semibold text-indigo-600">
                          {getTaskStatistics().memberStats[member]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* History Table - Mobile Responsive */}
              <div ref={historyTableContainerRef} className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                {initialHistoryLoading ? (
                  <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                    <p className="text-purple-600 text-sm sm:text-base">Loading history data...</p>
                  </div>
                ) : (
                  <>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Task ID
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Department
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Given By
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Name
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                            Task Description
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 whitespace-nowrap">
                            Task Start Date
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Freq
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Reminders
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Attachment
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 whitespace-nowrap">
                            Actual Date
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 whitespace-nowrap">
                            Status
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50 min-w-[120px]">
                            Remarks
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            File
                          </th>

                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredHistoryData.length > 0 ? (
                          filteredHistoryData.map((history, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                                  {history.task_id || "—"}
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.department || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.given_by || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.name || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4 min-w-[150px]">
                                <div className="text-xs sm:text-sm text-gray-900 break-words" title={history.task_description}>
                                  {history.task_description || "—"}
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">
                                  {history.task_start_date ? (() => {
                                    const date = parseSupabaseDate(history.task_start_date);
                                    if (!date || isNaN(date.getTime())) return "Invalid date";

                                    const day = date.getDate().toString().padStart(2, '0');
                                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                    const year = date.getFullYear();
                                    const hours = date.getHours().toString().padStart(2, '0');
                                    const minutes = date.getMinutes().toString().padStart(2, '0');
                                    const seconds = date.getSeconds().toString().padStart(2, '0');

                                    return (
                                      <div>
                                        <div className="font-medium break-words">
                                          {`${day}/${month}/${year}`}
                                        </div>
                                        <div className="text-xs text-gray-500 break-words">
                                          {`${hours}:${minutes}:${seconds}`}
                                        </div>
                                      </div>
                                    );
                                  })() : "—"}
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.frequency || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.enable_reminder || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">{history.require_attachment || "—"}</div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4 bg-green-50">
                                <div className="text-xs sm:text-sm text-gray-900 break-words">
                                  {history.submission_date ? (() => {
                                    const dateObj = new Date(history.submission_date);
                                    const day = ("0" + dateObj.getDate()).slice(-2);
                                    const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
                                    const year = dateObj.getFullYear();
                                    const hours = ("0" + dateObj.getHours()).slice(-2);
                                    const minutes = ("0" + dateObj.getMinutes()).slice(-2);
                                    const seconds = ("0" + dateObj.getSeconds()).slice(-2);

                                    return (
                                      <div>
                                        <div className="font-medium break-words">
                                          {`${day}/${month}/${year}`}
                                        </div>
                                        <div className="text-xs text-gray-500 break-words">
                                          {`${hours}:${minutes}:${seconds}`}
                                        </div>
                                      </div>
                                    );
                                  })() : "—"}
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4 bg-blue-50">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full break-words ${history.status === "yes"
                                    ? "bg-green-100 text-green-800"
                                    : history.status === "no"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                  {history.status || "—"}
                                </span>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4 bg-purple-50 min-w-[120px]">
                                <div className="text-xs sm:text-sm text-gray-900 break-words" title={history.remark}>
                                  {history.remark || "—"}
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-4">
                                {history.image ? (
                                  <a
                                    href={history.image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline flex items-center break-words text-xs sm:text-sm"
                                  >
                                    <img
                                      src={history.image || "/placeholder.svg?height=32&width=32"}
                                      alt="Attachment"
                                      className="h-6 w-6 sm:h-8 sm:w-8 object-cover rounded-md mr-2 flex-shrink-0"
                                    />
                                    <span className="break-words">View</span>
                                  </a>
                                ) : (
                                  <span className="text-gray-400 text-xs sm:text-sm">no file</span>
                                )}
                              </td>

                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={userRole === "admin" ? 15 : 13} className="px-4 sm:px-6 py-4 text-center text-gray-500 text-xs sm:text-sm">
                              {searchTerm || selectedMembers.length > 0 || startDate || endDate
                                ? "no historical records matching your filters"
                                : "no completed records found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {isLoadingMoreHistory && (
                      <div className="sticky bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-center items-center py-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                          <span className="text-purple-600 text-xs sm:text-sm">Loading more history...</span>
                        </div>
                      </div>
                    )}

                    {!hasMoreHistory && history.length > 0 && (
                      <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">
                        no more history to load
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            /* Regular Tasks Table - Mobile Responsive */
            <div
              ref={tableContainerRef}
              className="overflow-x-auto"
              style={{ maxHeight: 'calc(100vh - 250px)' }}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-16">
                      Seq. no.
                    </th>
                    {(userRole === "user" || userRole === "admin") && (
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          checked={filteredAccountData.length > 0 && selectedItems.size === filteredAccountData.length}
                          onChange={handleSelectAllItems}
                        />
                      </th>
                    )}
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Task ID
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Department
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Given By
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Task Description
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 whitespace-nowrap">
                      Task Start Date
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Freq
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Reminders
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Attachment
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Remarks
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Upload Image
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccountData.length > 0 ? (
                    filteredAccountData.map((account, index) => {
                      const isSelected = selectedItems.has(account.task_id);
                      const sequenceNumber = index + 1;
                      return (
                        <tr key={index} className={`${isSelected ? "bg-purple-50" : ""} hover:bg-gray-50`}>
                          <td className="px-2 sm:px-3 py-2 sm:py-4 w-16">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 text-center">
                              {sequenceNumber}
                            </div>
                          </td>
                          {(userRole === "user" || userRole === "admin") && (
                            <td className="px-2 sm:px-3 py-2 sm:py-4 w-12 text-center">
                              {account.task_start_date && (() => {
                                const startDate = new Date(account.task_start_date);
                                const today = new Date(new Date().setHours(0, 0, 0, 0));
                                const taskDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                                const isUpcoming = taskDateOnly > today;

                                if (taskDateOnly < today) {
                                  return (
                                    <div className="mb-1">
                                      <span className="bg-red-600 text-white text-[9px] font-black px-1 rounded-sm uppercase">Overdue</span>
                                    </div>
                                  );
                                } else if (taskDateOnly.getTime() === today.getTime()) {
                                  return (
                                    <div className="mb-1">
                                      <span className="bg-orange-500 text-white text-[9px] font-black px-1 rounded-sm uppercase">Today</span>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="mb-1">
                                      <span className="bg-blue-500 text-white text-[9px] font-black px-1 rounded-sm uppercase whitespace-nowrap">Upcoming</span>
                                    </div>
                                  );
                                }
                              })()}
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                checked={isSelected}
                                onChange={(e) => handleCheckboxClick(e, account.task_id)}
                                disabled={(() => {
                                  if (!account.task_start_date) return false;
                                  const startDate = new Date(account.task_start_date);
                                  const today = new Date(new Date().setHours(0, 0, 0, 0));
                                  const taskDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                                  return taskDateOnly > today;
                                })()}
                              />
                            </td>
                          )}
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.task_id || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.department || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.given_by || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.name || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4 min-w-[150px]">
                            <div className="text-xs sm:text-sm text-gray-900 break-words" title={account.task_description}>
                              {account.task_description || "—"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">
                              {account.task_start_date ? (() => {
                                const dateObj = new Date(account.task_start_date);
                                const formattedDate = `${("0" + dateObj.getDate()).slice(-2)
                                  }/${("0" + (dateObj.getMonth() + 1)).slice(-2)
                                  }/${dateObj.getFullYear()
                                  } ${("0" + dateObj.getHours()).slice(-2)
                                  }:${("0" + dateObj.getMinutes()).slice(-2)
                                  }:${("0" + dateObj.getSeconds()).slice(-2)
                                  }`;

                                return (
                                  <div>
                                    <div className="font-medium break-words">
                                      {formattedDate.split(" ")[0]}
                                    </div>
                                    <div className="text-xs text-gray-500 break-words">
                                      {formattedDate.split(" ")[1]}
                                    </div>
                                  </div>
                                );
                              })() : "—"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.frequency || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.enable_reminder || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 break-words">{account.require_attachment || "—"}</div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50">
                            <select
                              disabled={!isSelected}
                              value={additionalData[account.task_id] || ""}
                              onChange={(e) => {
                                setAdditionalData((prev) => ({ ...prev, [account.task_id]: e.target.value }));
                                if (e.target.value !== "no") {
                                  setRemarksData((prev) => {
                                    const newData = { ...prev };
                                    delete newData[account.task_id];
                                    return newData;
                                  });
                                }
                              }}
                              className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed text-xs sm:text-sm"
                            >
                              <option value="">Select...</option>
                              <option value="yes">yes</option>
                              <option value="no">no</option>
                            </select>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4 bg-orange-50 min-w-[120px]">
                            <input
                              type="text"
                              placeholder="Enter remarks"
                              disabled={!isSelected || !additionalData[account.task_id]}
                              value={remarksData[account.task_id] || ""}
                              onChange={(e) => setRemarksData((prev) => ({ ...prev, [account.task_id]: e.target.value }))}
                              className="border rounded-md px-2 py-1 w-full border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-xs sm:text-sm break-words"
                            />
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-4 bg-green-50">
                            {uploadedImages[account.task_id] || account.image ? (
                              <div className="flex items-center">
                                <img
                                  src={
                                    uploadedImages[account.task_id]?.previewUrl ||
                                    (typeof account.image === 'string' ? account.image : '')
                                  }
                                  alt="Receipt"
                                  className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded-md mr-2 flex-shrink-0"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs text-gray-500 break-words">
                                    {uploadedImages[account.task_id]?.file.name ||
                                      (account.image instanceof File ? account.image.name : "Uploaded")}
                                  </span>
                                  {uploadedImages[account.task_id] ? (
                                    <span className="text-xs text-green-600">Ready</span>
                                  ) : (
                                    <button
                                      className="text-xs text-purple-600 hover:text-purple-800 break-words"
                                      onClick={() => window.open(account.image, "_blank")}
                                    >
                                      View
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <label
                                className={`flex items-center cursor-pointer ${account.require_attachment?.toUpperCase() === "yes" &&
                                  additionalData[account.task_id] !== "no" // Only show as required if status is not "no"
                                  ? "text-red-600 font-medium"
                                  : "text-purple-600"
                                  } hover:text-purple-800`}
                              >
                                <Upload className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="text-xs break-words">
                                  {account.require_attachment?.toUpperCase() === "yes" &&
                                    additionalData[account.task_id] !== "no"
                                    ? "Required*"
                                    : "Upload"}
                                </span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(account.task_id, e)}
                                  disabled={!isSelected}
                                />
                              </label>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={13} className="px-4 sm:px-6 py-4 text-center text-gray-500 text-xs sm:text-sm">
                        {searchTerm
                          ? "no tasks matching your search"
                          : "no pending tasks found for today, tomorrow, or past due dates"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {isFetchingMore && (
                <div className="sticky bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-center items-center py-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                    <span className="text-purple-600 text-xs sm:text-sm">Loading more tasks...</span>
                  </div>
                </div>
              )}

              {!hasMore && checklist.length > 0 && (
                <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">
                  no more tasks to load
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AccountDataPage
