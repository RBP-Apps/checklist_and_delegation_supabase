import supabase from "../../SupabaseClient";

// In your API file
// 1. COMPLETE API FUNCTIONS - checkListApi.js

export const fetchChechListDataSortByDate = async (page = 1, limit = 50, searchTerm = '', statusFilter = 'all', nameFilter = '') => {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');
  const userAccess = localStorage.getItem('user_access');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Helper to get ISO string that matches local time digits (treating local as UTC)
    // This handles the case where DB stores local timestamps as UTC-naive
    // Strip 'Z' so the string matches 'timestamp without time zone' column
    const toLocalISOString = (date) => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().replace('Z', '');
    };

    const todayISO = toLocalISOString(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowISO = toLocalISOString(tomorrow);

    console.log("Filtering (Local Adjusted):", { statusFilter, todayISO, tomorrowISO, userTime: new Date().toString() });

    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + 60); // Fetch up to 60 days in the future
    const futureLimitISO = toLocalISOString(futureLimit);

    // Calculate range for pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('checklist')
      .select('*', { count: 'exact' })
      .is("submission_date", null)
      .is("status", null);

    // Apply Status Filter
    if (statusFilter === 'today') {
      // Tasks for today (start date >= today AND start date < tomorrow)
      query = query
        .gte('task_start_date', todayISO)
        .lt('task_start_date', tomorrowISO)
        .order('task_start_date', { ascending: true });
    } else if (statusFilter === 'upcoming') {
      // Tasks for future (start date > tomorrow)
      query = query
        .gt('task_start_date', tomorrowISO)
        .lte('task_start_date', futureLimitISO)
        .order('task_start_date', { ascending: true });
    } else if (statusFilter === 'overdue') {
      // Tasks before today
      query = query
        .lt('task_start_date', todayISO)
        .order('task_start_date', { ascending: true }); // Oldest first for overdue
    } else {
      // Default behavior (All pending)
      // We still want to see everything up to future limit
      query = query
        .lte('task_start_date', futureLimitISO)
        .order('task_start_date', { ascending: true });
    }

    // Apply name filter (backend-based, from "All Names" dropdown)
    if (nameFilter && nameFilter.trim() !== '') {
      query = query.eq('name', nameFilter.trim());
    } else if (role === 'user' && username) {
      // Apply role filter only when no explicit name filter is set
      query = query.eq('name', username);
    }
    // Admin users without a name filter see all data

    // Apply pagination
    query = query.range(from, to);

    // Apply search filter if searchTerm exists
    if (searchTerm && searchTerm.trim() !== '') {
      const searchValue = searchTerm.trim();
      query = query.or(`task_id.ilike.%${searchValue}%,name.ilike.%${searchValue}%,given_by.ilike.%${searchValue}%,department.ilike.%${searchValue}%,task_description.ilike.%${searchValue}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.log("Error when fetching data", error);
      return { data: [], totalCount: 0 };
    }

    console.log("Fetched successfully", data);
    return { data, totalCount: count };

  } catch (error) {
    console.log("Error from Supabase", error);
    return { data: [], totalCount: 0 };
  }
};

export const fetchChechListDataForHistory = async (page = 1, searchTerm = '', nameFilter = '') => {
  const itemsPerPage = 50;
  const start = (page - 1) * itemsPerPage;

  const role = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');
  const userAccess = localStorage.getItem('user_access');

  try {
    let query = supabase
      .from('checklist')
      .select('*', { count: 'exact' })
      .order('task_start_date', { ascending: false })
      .not('submission_date', 'is', null)
      .not('status', 'is', null)
      .range(start, start + itemsPerPage - 1);

    // Apply search filter if searchTerm exists
    if (searchTerm && searchTerm.trim() !== '') {
      const searchValue = searchTerm.trim();
      query = query.or(`task_id.ilike.%${searchValue}%,name.ilike.%${searchValue}%,given_by.ilike.%${searchValue}%,department.ilike.%${searchValue}%,task_description.ilike.%${searchValue}%`);
    }

    // Apply name filter (backend-based, from "All Names" dropdown)
    if (nameFilter && nameFilter.trim() !== '') {
      query = query.eq('name', nameFilter.trim());
    } else if (role === 'user' && username) {
      query = query.eq('name', username);
    }
    // Admin users without a name filter see all data

    const { data, error, count } = await query;

    if (error) {
      console.log("Error when fetching data", error);
      return [];
    }

    console.log("Fetched successfully", data);
    return data;

  } catch (error) {
    console.log("Error from Supabase", error);
    return [];
  }
};



export const updateChecklistData = async (submissionData) => {
  try {
    // Validate input data
    if (!Array.isArray(submissionData) || submissionData.length === 0) {
      throw new Error('Invalid submission data');
    }

    const updates = await Promise.all(submissionData.map(async (item) => {
      let imageUrl = null;

      // Handle image upload if it exists
      if (item.image && item.image.previewUrl) {
        try {
          // 1. Convert blob URL to actual file
          const response = await fetch(item.image.previewUrl);
          const blob = await response.blob();
          const file = new File([blob], item.image.name, { type: item.image.type });

          // 2. Generate unique file path
          const fileExt = item.image.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `task-${item.taskId}/${fileName}`;

          // 3. Upload to Supabase storage
          const { error: uploadError } = await supabase.storage
            .from('checklist-delegation')
            .upload(filePath, file, {
              cacheControl: '3600',
              contentType: item.image.type,
              upsert: false
            });

          if (uploadError) throw uploadError;

          // 4. Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('checklist-delegation')
            .getPublicUrl(filePath);

          if (!publicUrl) throw new Error('Failed to generate public URL');

          imageUrl = publicUrl;
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
      }

      // Prepare update object
      // Build submission_date without timezone suffix for 'timestamp without time zone' column
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localISO = new Date(now.getTime() - offset).toISOString().replace('Z', '');

      return {
        task_id: item.taskId,
        status: item.status,
        remark: item.remarks,
        submission_date: localISO,
        image: imageUrl,
        // // Add other fields as needed
        // department: item.department,
        // task_description: item.taskDescription,
        // given_by: item.givenBy
      };
    }));

    // 5. Update checklist table individually for reliability and to avoid enum errors
    console.log('Starting Supabase updates for IDs:', updates.map(u => u.task_id));

    const results = await Promise.all(updates.map(async (updateObj) => {
      // Ensure we ONLY send fields that should be updated
      const cleanUpdate = {
        status: updateObj.status,
        remark: updateObj.remark,
        submission_date: updateObj.submission_date,
        image: updateObj.image
      };

      const { data, error } = await supabase
        .from('checklist')
        .update(cleanUpdate)
        .eq('task_id', updateObj.task_id)
        .select();

      if (error) {
        console.error(`Error updating task ${updateObj.task_id}:`, error);
        throw error;
      }
      return data[0];
    }));

    console.log('Successfully updated checklist in Supabase:', results);
    return results;

  } catch (error) {
    console.error('Error in updateChecklistData:', error);
    throw new Error(`Failed to update checklist: ${error.message}`);
  }
};


export const postChecklistAdminDoneAPI = async (selectedHistoryItems) => {
  try {
    if (!selectedHistoryItems || selectedHistoryItems.length === 0) {
      console.log("No items selected for marking as done");
      return { error: "No items selected" };
    }

    // Get current timestamp for admin_done column
    // const currentDate = new Date();
    // const formattedDate = currentDate.toISOString(); // Or format as needed

    // Prepare the updates
    const updates = selectedHistoryItems.map(item => ({
      task_id: typeof item === 'object' ? item.task_id : item,
      admin_done: "Done",
      // You can add other fields to update if needed
    }));

    // Perform the update in Supabase
    const { data, error } = await supabase
      .from('checklist')
      .upsert(updates) // Using upsert to update existing records
      .select();

    if (error) {
      console.error("Error updating checklist items:", error);
      return { error };
    }

    console.log("Successfully updated items:", data);
    return { data };

  } catch (error) {
    console.error("Error in supabase operation:", error);
    return { error };
  }
};