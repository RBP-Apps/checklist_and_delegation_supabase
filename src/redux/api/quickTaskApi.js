import supabase from "../../SupabaseClient";

// Update fetchChecklistData to support pagination and filtering
// More efficient approach using window functions (if supported by Supabase)
export const fetchChecklistData = async (
  page = 0,
  pageSize = 50,
  nameFilter = "",
  deptFilter = "",
) => {
  try {
    const start = page * pageSize;
    const end = start + pageSize - 1;

    // Step 1: Paginated fetch of all task_descriptions
    // Supabase server-side max is 1000 rows — .limit() cannot override it.
    // We use .range() in a loop to fetch all rows in batches.
    let allRawRows = [];
    let from = 0;
    const BATCH = 1000;
    while (true) {
      let q = supabase
        .from("checklist")
        .select("task_description")
        .is("submission_date", null)
        .not("task_description", "is", null)
        .range(from, from + BATCH - 1);

      if (nameFilter) q = q.eq("name", nameFilter);
      if (deptFilter) q = q.eq("department", deptFilter);

      const { data: batch, error: batchError } = await q;
      if (batchError) {
        return { data: [], total: 0 };
      }
      if (!batch || batch.length === 0) break;
      allRawRows = [...allRawRows, ...batch];
      if (batch.length < BATCH) break; // last page
      from += BATCH;
    }

    // Deduplicate task_descriptions client-side
    const seenDescriptions = new Set();
    const uniqueDescriptions = allRawRows
      .map((row) => row.task_description)
      .filter((desc) => {
        if (!desc || seenDescriptions.has(desc)) return false;
        seenDescriptions.add(desc);
        return true;
      });

    if (uniqueDescriptions.length === 0) {
      return { data: [], total: 0 };
    }

    // Step 2: Get paginated slice of unique descriptions for current page
    const paginatedDescriptions = uniqueDescriptions.slice(start, end + 1);

    if (paginatedDescriptions.length === 0) {
      return { data: [], total: uniqueDescriptions.length };
    }

    // Step 3: Fetch actual data only for the paginated unique descriptions
    let dataQuery = supabase
      .from("checklist")
      .select("*")
      .in("task_description", paginatedDescriptions)
      .is("submission_date", null)
      .order("task_start_date", { ascending: true });

    if (nameFilter) {
      dataQuery = dataQuery.eq("name", nameFilter);
    }
    if (deptFilter) {
      dataQuery = dataQuery.eq("department", deptFilter);
    }

    const { data, error } = await dataQuery;

    if (error) {
      return { data: [], total: 0 };
    }

    // Final client-side deduplication (should be minimal now)
    const finalSeen = new Set();
    const finalData = (data || []).filter((row) => {
      if (finalSeen.has(row.task_description)) {
        return false;
      }
      finalSeen.add(row.task_description);
      return true;
    });

    return {
      data: finalData,
      total: uniqueDescriptions.length,
    };
  } catch (error) {
    return { data: [], total: 0 };
  }
};

// Update fetchDelegationData similarly
export const fetchDelegationData = async (
  page = 0,
  pageSize = 50,
  nameFilter = "",
  deptFilter = "",
) => {
  try {
    const start = page * pageSize;
    const end = start + pageSize - 1;

    // Step 1: Get unique task_descriptions with conditions applied at database level
    let uniqueQuery = supabase
      .from("delegation")
      .select("task_description")
      .is("submission_date", null)
      .not("task_description", "is", null);

    if (nameFilter) {
      uniqueQuery = uniqueQuery.eq("name", nameFilter);
    }
    if (deptFilter) {
      uniqueQuery = uniqueQuery.eq("department", deptFilter);
    }

    const { data: allUniqueDescriptions, error: uniqueError } =
      await uniqueQuery;

    if (uniqueError) {
      return { data: [], total: 0 };
    }

    // Get truly unique descriptions
    const seenDescriptions = new Set();
    const uniqueDescriptions = (allUniqueDescriptions || [])
      .map((row) => row.task_description)
      .filter((desc) => {
        if (!desc || seenDescriptions.has(desc)) return false;
        seenDescriptions.add(desc);
        return true;
      });

    if (uniqueDescriptions.length === 0) {
      return { data: [], total: 0 };
    }

    // Step 2: Get paginated slice of unique descriptions for current page
    const paginatedDescriptions = uniqueDescriptions.slice(start, end + 1);

    if (paginatedDescriptions.length === 0) {
      return { data: [], total: uniqueDescriptions.length };
    }

    // Step 3: Fetch actual data only for the paginated unique descriptions
    let dataQuery = supabase
      .from("delegation")
      .select("*")
      .in("task_description", paginatedDescriptions)
      .is("submission_date", null)
      .order("task_id", { ascending: true });

    if (nameFilter) {
      dataQuery = dataQuery.eq("name", nameFilter);
    }
    if (deptFilter) {
      dataQuery = dataQuery.eq("department", deptFilter);
    }

    const { data, error } = await dataQuery;

    if (error) {
      return { data: [], total: 0 };
    }

    // Final client-side deduplication
    const finalSeen = new Set();
    const finalData = (data || []).filter((row) => {
      if (finalSeen.has(row.task_description)) {
        return false;
      }
      finalSeen.add(row.task_description);
      return true;
    });

    return {
      data: finalData,
      total: uniqueDescriptions.length,
    };
  } catch (error) {
    return { data: [], total: 0 };
  }
};

export const deleteChecklistTasksApi = async (tasks) => {
  for (const task of tasks) {
    const { error } = await supabase
      .from("checklist")
      .delete()
      .eq("name", task.name)
      .eq("task_description", task.task_description)
      .is("submission_date", null); // only delete if submission_date is null

    if (error) throw error;
  }
  return tasks;
};

export const deleteDelegationTasksApi = async (taskIds) => {
  const { error } = await supabase
    .from("delegation")
    .delete()
    .in("task_id", taskIds)
    .is("submission_date", null); // ✅ only delete if submission_date IS NULL

  if (error) throw error;
  return taskIds;
};

// New function to update checklist task - matches department, name, task_description
export const updateChecklistTaskApi = async (updatedTask, originalTask) => {
  try {

    const { data, error } = await supabase
      .from("checklist")
      .update({
        department: updatedTask.department,
        given_by: updatedTask.given_by,
        name: updatedTask.name,
        task_description: updatedTask.task_description,
        // task_start_date: updatedTask.task_start_date,
        // frequency: updatedTask.frequency,
        enable_reminder: updatedTask.enable_reminder,
        require_attachment: updatedTask.require_attachment,
        remark: updatedTask.remark,
      })
      .eq("department", originalTask.department)
      .eq("name", originalTask.name)
      .eq("task_description", originalTask.task_description)
      .is("submission_date", null)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Add this new function
export const fetchUsersData = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_name, department")
      .not("user_name", "is", null); // Only get rows where user_name is not null

    if (error) {
      return [];
    }

    return data;
  } catch (error) {
    return [];
  }
};