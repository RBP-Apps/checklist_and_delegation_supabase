import supabase from "../SupabaseClient";

/**
 * Sends a WhatsApp notification using Maytapi
 * @param {string} userName - The name of the user to notify
 * @param {string} message - The message text
 */
export const sendWhatsAppNotification = async (userName, message) => {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("number")
      .eq("user_name", userName)
      .single();

    if (userError || !user?.number) {
      console.warn(
        `⚠️ Could not send WhatsApp: User ${userName} phone not found.`,
      );
      return;
    }

    const {
      VITE_MAYTAPI_PRODUCT_ID: productId,
      VITE_MAYTAPI_TOKEN: token,
      VITE_MAYTAPI_PHONE_ID: phoneId,
    } = import.meta.env;
    if (!productId || !token || !phoneId) {
      console.warn("⚠️ Maytapi credentials missing in .env");
      return;
    }

    const phone = String(user.number);
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    const response = await fetch(
      `https://api.maytapi.com/api/${productId}/${phoneId}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maytapi-key": token,
        },
        body: JSON.stringify({
          to_number: formattedPhone,
          type: "text",
          message: message,
        }),
      },
    );

    const result = await response.json();
    if (result.success) {
      console.log(`✅ WhatsApp sent to ${userName}`);
    } else {
      console.error("❌ Maytapi Error:", result);
    }
  } catch (error) {
    console.error("🛑 WhatsApp Service Error:", error);
  }
};

/**
 * Fetches user stats from both checklist and delegation tables and sends a daily task summary
 * Template: Daily Task Summary
 * Recipient: User
 */
export const sendDailyTaskSummary = async (userName) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;

    // --- CHECKLIST QUERIES ---
    const checklistTotal = supabase
      .from("checklist")
      .select("*", { count: "exact", head: true })
      .eq("name", userName)
      .lte("task_start_date", `${today}T23:59:59`);

    const checklistPending = supabase
      .from("checklist")
      .select("*", { count: "exact", head: true })
      .eq("name", userName)
      .lte("task_start_date", `${today}T23:59:59`)
      .is("submission_date", null);

    const checklistToday = supabase
      .from("checklist")
      .select("*", { count: "exact", head: true })
      .eq("name", userName)
      .gte("task_start_date", `${today}T00:00:00`)
      .lte("task_start_date", `${today}T23:59:59`)
      .is("submission_date", null);

    // --- DELEGATION QUERIES ---
    const delegationTotal = supabase
      .from("delegation")
      .select("*", { count: "exact", head: true })
      .eq("name", userName)
      .lte("task_start_date", `${today}T23:59:59`);

    const delegationPending = supabase
      .from("delegation")
      .select("*", { count: "exact", head: true })
      .eq("name", userName)
      .lte("task_start_date", `${today}T23:59:59`)
      .or("submission_date.is.null,status.eq.extend");

    const delegationToday = supabase
      .from("delegation")
      .select("*", { count: "exact", head: true })
      .eq("name", userName)
      .gte("task_start_date", `${today}T00:00:00`)
      .lte("task_start_date", `${today}T23:59:59`)
      .or("submission_date.is.null,status.eq.extend");

    const [cTotal, cPending, cToday, dTotal, dPending, dToday] =
      await Promise.all([
        checklistTotal,
        checklistPending,
        checklistToday,
        delegationTotal,
        delegationPending,
        delegationToday,
      ]);

    const total = (cTotal.count || 0) + (dTotal.count || 0);
    const pending = (cPending.count || 0) + (dPending.count || 0);
    const todayCount = (cToday.count || 0) + (dToday.count || 0);

    const message = `📝 *Daily Task Summary*\n👋 Hello ${userName},\n\nHere is your task update for today:\n\n📋 Total Tasks: ${total}\n⏳ Total Pending: ${pending}\n📅 Today’s Tasks: ${todayCount}\n👉Click the Link Below - https://checklist-delegation-supabase-six.vercel.app\n\nPlease stay on top of your tasks and let us know if you need any assistance! 😊\n\nBest regards,\nThe Divine Empire Team`;

    await sendWhatsAppNotification(userName, message);
  } catch (error) {
    console.error("🛑 Task Summary Error:", error);
  }
};

/**
 * Notifies a user when a new delegation is assigned
 * Template: REMINDER: DELEGATION TASK
 * Recipient: User
 */
export const notifyTaskAssignment = async (userName, task) => {
  const message = `🔔 *REMINDER: DELEGATION TASK*\nDear ${userName},\n\nYou have been assigned a new task. Please find the details below:\n\n📌 Task ID: ${task.task_id || "N/A"}\n🧑💼 Allocated By: ${task.given_by}\n📝 Task Description: ${task.task_description}\n\n⏳ Deadline: ${task.task_start_date}\n✅ Closure Link: https://checklist-delegation-supabase-six.vercel.app\n\nPlease make sure the task is completed before the deadline. For any assistance, feel free to reach out.\n\nBest regards,\nThe Divine Empire India Pvt. Ltd.`;

  await sendWhatsAppNotification(userName, message);
};

/**
 * Notifies the task allocator (given_by person) when a delegation is extended
 * Template: TASK EXTENSION NOTICE
 * Recipient: The person who allocated the task (task.given_by)
 */
export const notifyTaskExtension = async (userName, task, nextDate) => {
  const allocatorName = task.given_by;

  if (!allocatorName) {
    console.warn(
      "⚠️ notifyTaskExtension: task.given_by is missing, cannot notify allocator.",
    );
    return;
  }

  const message = `🔄 *TASK EXTENSION NOTICE*\nDear ${allocatorName},\n\nThis is to inform you that the deadline for a delegated task has been extended for ${userName}. Please find the updated details below:\n\n📌 Task ID: ${task.task_id}\n� Assigned To: ${userName}\n📝 Task Description: ${task.task_description}\n\n⏳ Updated Deadline: ${nextDate}\n✅ Closure Link: https://checklist-delegation-supabase-six.vercel.app\n\nPlease ensure the task is completed within the new timeline. If you require any support, feel free to contact the concerned person.\n\nBest regards,\nThe Divine Empire India Pvt. Ltd.`;

  try {
    await sendWhatsAppNotification(allocatorName, message);
    console.log(
      `✅ Allocator (${allocatorName}) notified of extension (Task ${task.task_id})`,
    );
  } catch (error) {
    console.error("🛑 Extension Notification Error:", error);
  }
};
