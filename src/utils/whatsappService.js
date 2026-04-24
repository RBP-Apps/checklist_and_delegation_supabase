import supabase from "../SupabaseClient";
import { logWhatsApp, logError, logInfo } from "./log";

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

  const userMessage = `🔄 *TASK EXTENSION NOTICE*\nDear ${userName},\n\nYour extension request for the following task has been recorded:\n\n📌 Task ID: ${task.task_id}\n📝 Task Description: ${task.task_description}\n\n⏳ Updated Deadline: ${nextDate}\n✅ Closure Link: https://checklist-delegation-supabase-six.vercel.app\n\nPlease ensure the task is completed within the new timeline.\n\nBest regards,\nThe Divine Empire India Pvt. Ltd.`;

  try {
    await Promise.all([
      sendWhatsAppNotification(allocatorName, message),
      sendWhatsAppNotification(userName, userMessage),
    ]);
    console.log(
      `✅ Both ${allocatorName} and ${userName} notified of extension (Task ${task.task_id})`,
    );
  } catch (error) {
    console.error("🛑 Extension Notification Error:", error);
  }
};

// ============================================================
// ✅ META OFFICIAL WHATSAPP BUSINESS API — TEMPLATE FUNCTIONS
// ✅ Previous Maytapi logic above is UNCHANGED
// ============================================================

/**
 * Core sender — Meta's official WhatsApp Business API (template messages)
 */
const sendMetaTemplateMessage = async (phoneNumber, templateName, components = []) => {
  console.group(`📲 [Meta WhatsApp] Sending template: "${templateName}"`);

  // ── Step 1: Check credentials ──────────────────────────────
  const token   = import.meta.env.VITE_WHATSAPP_TOKEN;
  const phoneId = import.meta.env.VITE_WHATSAPP_PHONE_ID;

  console.log("🔑 STEP 1 — Credentials check:");
  console.log("   phoneId :", phoneId   || "❌ MISSING");
  console.log("   token   :", token ? `✅ present (${token.slice(0, 20)}...)` : "❌ MISSING");

  if (!token || !phoneId) {
    console.error("❌ Aborting — credentials missing in .env");
    console.groupEnd();
    return { success: false, error: "Missing credentials" };
  }

  // ── Step 2: Format phone number ────────────────────────────
  const phone          = String(phoneNumber).replace(/\D/g, "");
  const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;
  console.log(`📞 STEP 2 — Phone: raw="${phoneNumber}" → formatted="${formattedPhone}"`);

  // ── Step 3: Build request body ─────────────────────────────
  const body = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en" },
      ...(components.length > 0 && { components }),
    },
  };
  console.log("📦 STEP 3 — Request body:", JSON.stringify(body, null, 2));

  // ── Step 4: Send API request ───────────────────────────────
  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
  console.log(`🌐 STEP 4 — POST → ${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    // ── Step 5: Parse response ─────────────────────────────
    console.log(`📡 STEP 5 — HTTP Status: ${response.status} ${response.statusText}`);
    const result = await response.json();
    console.log("📨 STEP 6 — API Response:", JSON.stringify(result, null, 2));

    if (result.messages) {
      console.log(`✅ SUCCESS — Message ID: ${result.messages[0]?.id}`);
      logWhatsApp.sent(formattedPhone, templateName);
      console.groupEnd();
      return { success: true, result };
    } else {
      // ── Common failure reasons ─────────────────────────
      const errCode = result?.error?.code;
      const errMsg  = result?.error?.message || "Unknown error";
      console.error(`❌ FAILED — Code: ${errCode} | Message: ${errMsg}`);
      if (errCode === 190)  console.warn("💡 Hint: Access token expired or invalid. Generate a new token from Meta Developer Console.");
      if (errCode === 100)  console.warn("💡 Hint: Template name not found or not approved. Check template name spelling & approval status.");
      if (errCode === 131030) console.warn("💡 Hint: Phone number not registered on WhatsApp or incorrect format.");
      logWhatsApp.failed(formattedPhone, templateName, result);
      console.groupEnd();
      return { success: false, error: result };
    }
  } catch (error) {
    console.error("🛑 STEP 4 — Network/fetch error:", error);
    logWhatsApp.failed(formattedPhone, templateName, error);
    console.groupEnd();
    return { success: false, error };
  }
};

/**
 * Lookup phone from Supabase users table, then send Meta template
 */
const sendMetaTemplateToUser = async (userName, templateName, components = []) => {
  console.log(`👤 [Meta WhatsApp] Looking up phone for user: "${userName}"`);

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("number")
    .eq("user_name", userName)
    .single();

  if (userError) {
    console.error(`❌ Supabase error fetching phone for "${userName}":`, userError);
    logWhatsApp.noPhone(userName);
    return;
  }

  if (!user?.number) {
    console.warn(`⚠️ User "${userName}" found in DB but has no phone number.`);
    logWhatsApp.noPhone(userName);
    return;
  }

  console.log(`✅ Phone found for "${userName}": ${user.number}`);
  await sendMetaTemplateMessage(user.number, templateName, components);
};

// ─────────────────────────────────────────────────────────────
// 1️⃣  Task Assignment Notification
//     Template name : task_assignment_notification
//     Variables     : {{1}} name | {{2}} task_id | {{3}} given_by
//                     {{4}} task_description | {{5}} deadline
// ─────────────────────────────────────────────────────────────
export const metaNotifyTaskAssignment = async (userName, task) => {
  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: String(userName) },
        { type: "text", text: String(task.task_id || "N/A") },
        { type: "text", text: String(task.given_by || "N/A") },
        { type: "text", text: String(task.task_description || "N/A") },
        { type: "text", text: String(task.task_start_date || "N/A") },
      ],
    },
  ];
  await sendMetaTemplateToUser(userName, "task_assignment_notification", components);
};

// ─────────────────────────────────────────────────────────────
// 2️⃣  Task Extension Notice
//     Template name : task_extension_notice
//     Variables     : {{1}} name | {{2}} task_id | {{3}} task_description
//                     {{4}} nextDate | {{5}} role
//     Sends to BOTH allocator (given_by) AND the assignee (userName)
// ─────────────────────────────────────────────────────────────
export const metaNotifyTaskExtension = async (userName, task, nextDate) => {
  const allocatorName = task.given_by;

  const makeComponents = (recipientName, role) => [
    {
      type: "body",
      parameters: [
        { type: "text", text: String(recipientName) },
        { type: "text", text: String(task.task_id || "N/A") },
        { type: "text", text: String(task.task_description || "N/A") },
        { type: "text", text: String(nextDate || "N/A") },
        { type: "text", text: role },
      ],
    },
  ];

  const sends = [];
  if (allocatorName) {
    sends.push(
      sendMetaTemplateToUser(allocatorName, "task_extension_notice", makeComponents(allocatorName, "Task Allocator"))
    );
  }
  sends.push(
    sendMetaTemplateToUser(userName, "task_extension_notice", makeComponents(userName, "Task Assignee"))
  );

  await Promise.all(sends);
  logInfo("WhatsApp", `Extension notice sent to ${allocatorName} and ${userName} (Task ${task.task_id})`);
};

// ─────────────────────────────────────────────────────────────
// 3️⃣  Daily Task Summary
//     Template name : daily_task_summary
//     Variables     : {{1}} name | {{2}} total | {{3}} pending | {{4}} todayCount
// ─────────────────────────────────────────────────────────────
export const metaSendDailyTaskSummary = async (userName) => {
  try {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day   = String(now.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;

    const [cTotal, cPending, cToday, dTotal, dPending, dToday] = await Promise.all([
      supabase.from("checklist").select("*", { count: "exact", head: true }).eq("name", userName).lte("task_start_date", `${today}T23:59:59`),
      supabase.from("checklist").select("*", { count: "exact", head: true }).eq("name", userName).lte("task_start_date", `${today}T23:59:59`).is("submission_date", null),
      supabase.from("checklist").select("*", { count: "exact", head: true }).eq("name", userName).gte("task_start_date", `${today}T00:00:00`).lte("task_start_date", `${today}T23:59:59`).is("submission_date", null),
      supabase.from("delegation").select("*", { count: "exact", head: true }).eq("name", userName).lte("task_start_date", `${today}T23:59:59`),
      supabase.from("delegation").select("*", { count: "exact", head: true }).eq("name", userName).lte("task_start_date", `${today}T23:59:59`).or("submission_date.is.null,status.eq.extend"),
      supabase.from("delegation").select("*", { count: "exact", head: true }).eq("name", userName).gte("task_start_date", `${today}T00:00:00`).lte("task_start_date", `${today}T23:59:59`).or("submission_date.is.null,status.eq.extend"),
    ]);

    const total      = (cTotal.count   || 0) + (dTotal.count   || 0);
    const pending    = (cPending.count || 0) + (dPending.count || 0);
    const todayCount = (cToday.count   || 0) + (dToday.count   || 0);

    const components = [
      {
        type: "body",
        parameters: [
          { type: "text", text: String(userName) },
          { type: "text", text: String(total) },
          { type: "text", text: String(pending) },
          { type: "text", text: String(todayCount) },
        ],
      },
    ];

    await sendMetaTemplateToUser(userName, "daily_task_summary", components);
  } catch (error) {
    logError("WhatsApp", "Meta Daily Summary Error", error);
  }
};

