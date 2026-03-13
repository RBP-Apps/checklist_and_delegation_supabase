import supabase from "../../SupabaseClient";

export const fetchUserDetailsApi = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select('*, user_access, page_access, leave_date, leave_end_date, remark, employee_id') // Add employee_id and page_access
      .not("user_name", "is", null)
      .neq("user_name", "");

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


// export const fetchUserDetailsApi = async () => {
//   try {
//     const { data, error } = await supabase
//       .from("users")
//       .select('*, user_access, leave_date, leave_end_date, remark') // Add leave_end_date
//       .not("user_name", "is", null)
//       .neq("user_name", "");

//     if (error) {
//       console.log("Error when fetching data", error);
//       return [];
//     }

//     console.log("Fetched successfully", data);
//     return data;
//   } catch (error) {
//     console.log("Error from Supabase", error);
//     return [];
//   }
// };

export const fetchDepartmentDataApi = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, department, given_by')
      .not('department', 'is', null)     // Exclude null departments
      .neq('department', '')             // Exclude empty string departments
      .order('department', { ascending: true });

    if (error) {
      console.log("error when fetching data", error);
      return [];
    }

    // Filter unique combinations of department + given_by
    const uniqueDepartments = Array.from(
      new Map(
        data.map((item) => [`${item.department}-${item.given_by}`, item])
      ).values()
    );

    console.log("fetch successfully", uniqueDepartments);
    return uniqueDepartments;
  } catch (error) {
    console.log("error from supabase", error);
    return [];
  }
};



export const createUserApi = async (newUser) => {
  try {
    // Step 1: Get the current max ID
    const { data: maxIdData, error: maxIdError } = await supabase
      .from("users")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    if (maxIdError) {
      console.error("Error fetching last ID:", maxIdError);
      return;
    }

    const lastId = maxIdData?.[0]?.id || 0;
    const newId = lastId + 1;

    // Step 2: Insert user with new ID
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: newId,
          user_name: newUser.username,
          password: newUser.password,
          email_id: newUser.email,
          number: newUser.phone,
          employee_id: newUser.employee_id || null, // Add this line
          role: newUser.role,
          status: newUser.status,
          user_access: newUser.user_access,
          page_access: newUser.page_access
        }
      ])
      .select()
      .single();

    if (error) {
      console.log("Error when posting data:", error);
      throw error;
    } else {
      console.log("Posted successfully", data);
    }

    return data;
  } catch (error) {
    console.log("Error from Supabase:", error);
    throw error;
  }
};

export const updateUserDataApi = async ({ id, updatedUser }) => {
  try {
    const updateData = {
      user_name: updatedUser.user_name,
      password: updatedUser.password,
      email_id: updatedUser.email_id,
      number: updatedUser.number,
      employee_id: updatedUser.employee_id || null, // Add this line
      role: updatedUser.role,
      status: updatedUser.status,
      user_access: updatedUser.user_access,
      page_access: updatedUser.page_access
    };

    // Add leave data if provided
    if (updatedUser.leave_date !== undefined) {
      updateData.leave_date = updatedUser.leave_date;
    }
    if (updatedUser.leave_end_date !== undefined) {
      updateData.leave_end_date = updatedUser.leave_end_date;
    }
    if (updatedUser.remark !== undefined) {
      updateData.remark = updatedUser.remark;
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    console.log(data, "data")
    console.log(error, "error")
    if (error) {
      console.log("Error when update data", error);
      throw error;
    }

    console.log("update successfully", data);
    return data;
  } catch (error) {
    console.log("Error from Supabase", error);
    throw error;
  }
};


export const createDepartmentApi = async (newDept) => {
  try {
    // Step 1: Get the current max ID
    const { data: maxIdData, error: maxIdError } = await supabase
      .from("users")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    if (maxIdError) {
      console.error("Error fetching last ID:", maxIdError);
      return;
    }

    const lastId = maxIdData?.[0]?.id || 0; // default to 0 if no users yet
    const newId = lastId + 1;

    // Step 2: Insert user with new ID
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: newId, // 👈 manually setting the next ID
          department: newDept.name,
          given_by: newDept.givenBy,
        }
      ])
      .select()
      .single();

    if (error) {
      console.log("Error when posting data:", error);
    } else {
      console.log("Posted successfully", data);
    }

    return data;
  } catch (error) {
    console.log("Error from Supabase:", error);
  }
};

export const updateDepartmentDataApi = async ({ id, updatedDept }) => {
  console.log(updatedDept);

  try {
    if (!updatedDept || !updatedDept.department || !updatedDept.given_by) {
      throw new Error("Missing department or given_by data");
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        department: updatedDept.department,
        given_by: updatedDept.given_by,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.log("Error when updating data", error);
      throw error;
    }

    console.log("Updated successfully", data);
    return data;
  } catch (error) {
    console.log("Error from Supabase", error);
    throw error;
  }
};


export const deleteUserByIdApi = async (id) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("Error deleting user:", error);
      throw error;
    }

    console.log("User deleted successfully:", data);
    return data;
  } catch (error) {
    console.log("Error from Supabase:", error);
    throw error;
  }
};



// In your settingApi.js file, add these functions:

// Fetch only unique departments (without given_by)
export const fetchDepartmentsOnlyApi = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('department')
      .not('department', 'is', null)
      .neq('department', '')
      .order('department', { ascending: true });

    if (error) {
      console.log("error when fetching departments", error);
      return [];
    }

    // Get unique departments only
    const uniqueDepartments = [...new Set(data.map(item => item.department))]
      .filter(dept => dept) // Remove empty values
      .map(dept => ({ department: dept }));

    console.log("departments fetched successfully", uniqueDepartments);
    return uniqueDepartments;
  } catch (error) {
    console.log("error from supabase", error);
    return [];
  }
};

// Fetch only given_by data
export const fetchGivenByDataApi = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('given_by')
      .not('given_by', 'is', null)
      .neq('given_by', '')
      .order('given_by', { ascending: true });

    if (error) {
      console.log("error when fetching given_by data", error);
      return [];
    }

    // Get unique given_by values only
    const uniqueGivenBy = [...new Set(data.map(item => item.given_by))]
      .filter(givenBy => givenBy) // Remove empty values
      .map(givenBy => ({ given_by: givenBy }));

    console.log("given_by fetched successfully", uniqueGivenBy);
    return uniqueGivenBy;
  } catch (error) {
    console.log("error from supabase", error);
    return [];
  }
};
