"use client"

import React, { useState } from "react"
import { Upload } from "lucide-react"
import { useSheetData } from "../../hooks/useSheetData"
import DataPageLayout from "../../components/admin/DataPageLayout"
import DataTable from "../../components/admin/DataTable"

// Configuration
const CONFIG = {
  SHEET_NAME: "STORE", // Admin page uses STORE sheet
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbz47q4SiLvJJom8dRGteqjhufs0Iui4rYTLMeTYqOgY_MFrS0C0o0XkRCPzAOdEeg4jqg/exec",
  DRIVE_FOLDER_ID: "1xdahLZtnhCGnHve4HdPolTm5y4DLqdyl",
  PAGE_CONFIG: {
    title: "Admin Data",
    historyTitle: "Admin Data History",
    description: "Showing today and tomorrow's records with pending submissions",
    historyDescription: "Showing all completed records with submission dates"
  }
}


const createColumns = (isHistory) => [
  { label: "Timestamp", key: "col0" },
  { label: "ID", key: "col1" },
  { label: "Item", key: "col2" },
  { label: "Category", key: "col3" },
  { label: "Name", key: "col4" }, // Member
  { label: "Description", key: "col5" },
  { label: "Quantity", key: "col6" },
  { label: "Date", key: "col7" },
  { label: "Status", key: "col8" },
  { label: "Ref", key: "col9" },
  { label: "Attachment", key: "col10" }, // Column K
  { label: "Pending Date", key: "col11" }, // Column L
  { label: "Submission Date", key: "col12" }, // Column M
  // Dynamic filler cols if needed...
  { label: "Add. Info", key: "col14" }, // Column O?
  { label: "Admin Done", key: "col15" }, // Column P
  { label: "Final Status", key: "col16" }, // Column Q

  // Custom Action Column
  ...(!isHistory ? [{
    label: "Actions",
    key: "actions",
    render: (item, { isSelected, additionalData, setAdditionalData, remarksData, setRemarksData, handleImageUpload }) => {
      if (!isSelected) return null

      return (
        <div className="space-y-2 min-w-[200px]">
          <select
            value={additionalData[item._id] || ""}
            onChange={(e) => setAdditionalData(prev => ({ ...prev, [item._id]: e.target.value }))}
            className="w-full text-xs p-1 border rounded"
          >
            <option value="">Select Status</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>

          {additionalData[item._id] === "No" && (
            <input
              type="text"
              placeholder="Remarks..."
              value={remarksData[item._id] || ""}
              onChange={(e) => setRemarksData(prev => ({ ...prev, [item._id]: e.target.value }))}
              className="w-full text-xs p-1 border rounded"
            />
          )}

          {/* Check column K (col10) for YES */}
          {item.col10 && String(item.col10).toUpperCase() === "YES" && (
            <div className="flex items-center gap-1">
              <label className="cursor-pointer text-xs bg-gray-100 p-1 rounded flex items-center">
                <Upload size={12} className="mr-1" />
                {item._newImage ? "Image Selected" : "Upload"}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleImageUpload(item._id, e.target.files[0])}
                />
              </label>
            </div>
          )}
        </div>
      )
    }
  }] : [])
]


export default function AdminDataPage() {
  const {
    data,
    loading,
    error,
    filters,
    selection,
    actions
  } = useSheetData({
    sheetName: CONFIG.SHEET_NAME,
    scriptUrl: CONFIG.SCRIPT_URL,
    driveFolderId: CONFIG.DRIVE_FOLDER_ID
  })

  // Title Logic
  const currentTitle = filters.showHistory ? CONFIG.PAGE_CONFIG.historyTitle : CONFIG.PAGE_CONFIG.title
  const currentDesc = filters.showHistory ? CONFIG.PAGE_CONFIG.historyDescription : CONFIG.PAGE_CONFIG.description

  const [submitLoading, setSubmitLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")

  const handleSubmit = async () => {
    setSubmitLoading(true)
    const res = await actions.submitItems()
    setSubmitLoading(false)
    if (res.success) {
      setSuccessMsg("Submitted successfully!")
    } else {
      alert("Error: " + res.message)
    }
  }

  return (
    <DataPageLayout
      title={currentTitle}
      description={currentDesc}
      showHistory={filters.showHistory}
      onToggleHistory={() => filters.setShowHistory(!filters.showHistory)}
      searchTerm={filters.searchTerm}
      onSearchChange={filters.setSearchTerm}
      error={error}
      successMessage={successMsg}
      onClearSuccess={() => setSuccessMsg("")}
      actions={
        // In Admin Page, actions are shown on History page too?
        // Original: "Submit selected" shown when NOT history.
        // "Mark as Done" shown when History (for Admin users).
        !filters.showHistory ? (
          <button
            onClick={handleSubmit}
            disabled={selection.selectedItems.size === 0 || submitLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {submitLoading ? "Submitting..." : `Submit (${selection.selectedItems.size})`}
          </button>
        ) : (
          // History Actions (e.g. Mark as Done for real admin)
          // We can implement this if needed, but for now focusing on main logic
          null
        )
      }
    >
      {/* Filters */}
      <div className="p-4 bg-gray-50 border-b">
        <details>
          <summary className="cursor-pointer font-medium text-sm text-purple-700">Filter Members</summary>
          <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {filters.membersList.map((m, i) => (
              <label key={i} className="flex items-center space-x-1 text-xs bg-white p-1 rounded border">
                <input
                  type="checkbox"
                  checked={filters.selectedMembers.includes(m)}
                  onChange={(e) => {
                    if (e.target.checked) filters.setSelectedMembers(p => [...p, m])
                    else filters.setSelectedMembers(p => p.filter(x => x !== m))
                  }}
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </details>
      </div>

      <DataTable
        data={data}
        loading={loading}
        columns={createColumns(filters.showHistory)}
        selection={selection}
        showHistory={filters.showHistory}
      />
    </DataPageLayout>
  )
}