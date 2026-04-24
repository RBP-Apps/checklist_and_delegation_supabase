import { useEffect } from "react";
import { BellRing, FileCheck, Calendar as CalendarIcon, Clock } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { uniqueDepartmentData, uniqueGivenByData, uniqueDoerNameData } from "../../redux/slice/assignTaskSlice";
import { useDispatch, useSelector } from "react-redux";
import CalendarComponent from "../../components/common/Calendar";
import { useAssignTask } from "../../hooks/useAssignTask";
import useAssignTaskStore from "../../stores/useAssignTaskStore";
import { formatDate, formatDateTimeForStorage } from "../../utils/dateUtils";

export default function AssignTask() {
  const { department, doerName, givenBy } = useSelector((state) => state.assignTask);
  const userRole = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');

  const filteredDoerNames = doerName;

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(uniqueDepartmentData(username));
    dispatch(uniqueGivenByData());
    dispatch(uniqueDoerNameData());
  }, [dispatch, username]);

  // Use the custom hook and store
  const { generateTasks, handleSubmit, handleChange, handleSwitchChange } = useAssignTask();
  const {
    formData,
    date,
    time,
    showCalendar,
    generatedTasks,
    accordionOpen,
    setDate,
    setTime,
    setShowCalendar,
    setAccordionOpen
  } = useAssignTaskStore();


  const setState = useAssignTaskStore.setState;


  useEffect(() => {
    if (username) {
      setState((state) => ({
        formData: {
          ...state.formData,
          givenBy: username
        }
      }));
    }
  }, [username]);



  useEffect(() => {
    if (username && givenBy.length > 0) {
      setState((state) => ({
        formData: {
          ...state.formData,
          givenBy: username
        }
      }));
    }
  }, [givenBy, username]);

  const frequencies = [
    { value: "one-time", label: "One Time (No Recurrence)" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "fortnightly", label: "Fortnightly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "end-of-1st-week", label: "End of 1st Week" },
    { value: "end-of-2nd-week", label: "End of 2nd Week" },
    { value: "end-of-3rd-week", label: "End of 3rd Week" },
    { value: "end-of-4th-week", label: "End of 4th Week" },
    { value: "end-of-last-week", label: "End of Last Week" },


  ];

  const getFormattedDate = (date) => {
    if (!date) return "Select a date";
    return formatDate(date);
  };

  const getFormattedDateTime = () => {
    if (!date) return "Select date and time";
    const dateStr = formatDate(date);
    const timeStr = time || "09:00";
    return `${dateStr} at ${timeStr}`;
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-purple-500">
          Assign New Task
        </h1>
        <div className="rounded-lg border border-purple-200 bg-white shadow-md overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-purple-100">
              <h2 className="text-xl font-semibold text-purple-700">
                Task Details
              </h2>
              <p className="text-purple-600">
                Fill in the details to assign a new task to a staff member  deploy.
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Department Name Dropdown */}
              <div className="space-y-2">
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-purple-700"
                >
                  Department Name
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Department</option>
                  {department.map((deptName, index) => {
                    const deptValue = typeof deptName === 'object' && deptName !== null ? deptName.department : deptName;
                    return (
                      <option key={index} value={deptValue}>
                        {deptValue}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Given By Dropdown */}
              <div className="space-y-2">
                <label
                  htmlFor="givenBy"
                  className="block text-sm font-medium text-purple-700"
                >
                  Given By
                </label>
                {/* <select
                  id="givenBy"
                  name="givenBy"
                  value={formData.givenBy}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Given By</option>
                  {givenBy.map((person, index) => {
                    const personValue = typeof person === 'object' && person !== null ? person.given_by : person;
                    return (
                      <option key={index} value={personValue}>
                        {personValue}
                      </option>
                    );
                  })}
                </select> */}
                <select
                  id="givenBy"
                  name="givenBy"
                  value={formData.givenBy}
                  onChange={handleChange}
                  disabled
                  className="w-full rounded-md border cursor-not-allowed border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Given By</option>

                  {/* 👇 ye add karo */}
                  <option value={username}>{username}</option>

                  {givenBy.map((person, index) => {
                    const personValue =
                      typeof person === "object" && person !== null
                        ? person.given_by
                        : person;
                    return (
                      <option key={index} value={personValue}>
                        {personValue}
                      </option>
                    );
                  })}
                </select>
              </div>


              {/* Doer's Name Dropdown */}
              {/* Doer's Name Dropdown */}
              <div className="space-y-2">
                <label
                  htmlFor="doer"
                  className="block text-sm font-medium text-purple-700"
                >
                  Doer's Name
                </label>
                <select
                  id="doer"
                  name="doer"
                  value={formData.doer}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Doer</option>
                  {filteredDoerNames.map((doer, index) => (
                    <option key={index} value={doer}>
                      {doer}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-purple-700"
                >
                  Task Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter task description"
                  rows={4}
                  required
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Date, Time and Frequency */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-purple-700">
                    Task Start Date
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full flex justify-start items-center rounded-md border border-purple-200 p-2 text-left focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
                      {date ? getFormattedDate(date) : "Select a date"}
                    </button>
                    {showCalendar && (
                      <div className="absolute z-10 mt-1">
                        <CalendarComponent
                          date={date}
                          onChange={setDate}
                          onClose={() => setShowCalendar(false)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* NEW: Time Picker */}
                <div className="space-y-2">
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-purple-700"
                  >
                    Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      id="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 pl-8"
                    />
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-purple-500" />
                  </div>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <label
                    htmlFor="frequency"
                    className="block text-sm font-medium text-purple-700"
                  >
                    Frequency
                  </label>
                  <select
                    id="frequency"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {frequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* NEW: DateTime Display */}
              {date && time && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <p className="text-sm text-purple-700">
                    <strong>Selected Date & Time:</strong> {getFormattedDateTime()}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Will be stored as: {formatDateTimeForStorage(date, time)}
                  </p>
                </div>
              )}

              {/* Additional Options */}
              <div className="space-y-4 pt-2 border-t border-purple-100">
                <h3 className="text-lg font-medium text-purple-700 pt-2">
                  Additional Options
                </h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="enable-reminders"
                      className="text-purple-700 font-medium"
                    >
                      Enable Reminders
                    </label>
                    <p className="text-sm text-purple-600">
                      Send reminders before task due date
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BellRing className="h-4 w-4 text-purple-500" />
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="enable-reminders"
                        checked={formData.enableReminders}
                        onChange={(e) =>
                          handleSwitchChange("enableReminders", e)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-16 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="require-attachment"
                      className="text-purple-700 font-medium"
                    >
                      Require Attachment
                    </label>
                    <p className="text-sm text-purple-600">
                      User must upload a file when completing task
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileCheck className="h-4 w-4 text-purple-500" />
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="require-attachment"
                        checked={formData.requireAttachment}
                        onChange={(e) =>
                          handleSwitchChange("requireAttachment", e)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-16 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview and Submit Buttons */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={generateTasks}
                  className="w-full rounded-md border border-purple-200 bg-purple-50 py-2 px-4 text-purple-700 hover:bg-purple-100 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Preview Generated Tasks
                </button>

                {generatedTasks.length > 0 && (
                  <div className="w-full">
                    <div className="border border-purple-200 rounded-md">
                      <button
                        type="button"
                        onClick={() => setAccordionOpen(!accordionOpen)}
                        className="w-full flex justify-between items-center p-4 text-purple-700 hover:bg-purple-50 focus:outline-none"
                      >
                        <span className="font-medium">
                          {generatedTasks.length} Tasks Generated
                          {formData.frequency === "one-time"
                            ? ""
                            : ` (${formData.frequency})`}
                        </span>
                        <span>{accordionOpen ? "▲" : "▼"}</span>
                      </button>

                      {accordionOpen && (
                        <div className="p-4 bg-purple-50 border-t border-purple-100 max-h-60 overflow-y-auto">
                          <table className="min-w-full divide-y divide-purple-200">
                            <thead className="bg-purple-100">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                  #
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                  Due Date
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                                  Time
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-purple-100">
                              {generatedTasks.map((task, index) => {
                                const dateTime = new Date(task.dueDate);
                                return (
                                  <tr key={index}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {index + 1}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                      {dateTime.toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                      {dateTime.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Confirm & Assign Tasks
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}