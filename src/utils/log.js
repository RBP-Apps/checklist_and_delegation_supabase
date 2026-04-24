import supabase from "../SupabaseClient";

// ─────────────────────────────────────────────────────────────
// LOG LEVELS
// ─────────────────────────────────────────────────────────────
export const LOG_LEVEL = {
  INFO:    "INFO",
  WARN:    "WARN",
  ERROR:   "ERROR",
  SUCCESS: "SUCCESS",
  DEBUG:   "DEBUG",
};

// ─────────────────────────────────────────────────────────────
// CONFIG — set SAVE_TO_DB = true once you create the
// app_logs table in Supabase (schema at bottom of this file)
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  SAVE_TO_DB:    false,   // flip to true after creating app_logs table
  SHOW_IN_CONSOLE: true,
  TABLE_NAME:    "app_logs",
};

// Console colors (browser-friendly)
const STYLES = {
  [LOG_LEVEL.INFO]:    "color:#3b82f6;font-weight:bold",   // blue
  [LOG_LEVEL.WARN]:    "color:#f59e0b;font-weight:bold",   // amber
  [LOG_LEVEL.ERROR]:   "color:#ef4444;font-weight:bold",   // red
  [LOG_LEVEL.SUCCESS]: "color:#22c55e;font-weight:bold",   // green
  [LOG_LEVEL.DEBUG]:   "color:#a855f7;font-weight:bold",   // purple
};

const EMOJI = {
  [LOG_LEVEL.INFO]:    "ℹ️",
  [LOG_LEVEL.WARN]:    "⚠️",
  [LOG_LEVEL.ERROR]:   "❌",
  [LOG_LEVEL.SUCCESS]: "✅",
  [LOG_LEVEL.DEBUG]:   "🔍",
};

// ─────────────────────────────────────────────────────────────
// INTERNAL: format timestamp
// ─────────────────────────────────────────────────────────────
const getTimestamp = () => {
  const now = new Date();
  return now.toLocaleString("en-IN", { hour12: false });
};

// ─────────────────────────────────────────────────────────────
// INTERNAL: persist to Supabase app_logs table (optional)
// ─────────────────────────────────────────────────────────────
const saveToDb = async (level, module, message, meta = null) => {
  if (!CONFIG.SAVE_TO_DB) return;

  try {
    await supabase.from(CONFIG.TABLE_NAME).insert([
      {
        level,
        module,
        message: typeof message === "object" ? JSON.stringify(message) : message,
        meta: meta ? JSON.stringify(meta) : null,
        created_at: new Date().toISOString().replace("Z", ""),
      },
    ]);
  } catch {
    // silently fail — don't let logging break the app
  }
};

// ─────────────────────────────────────────────────────────────
// INTERNAL: core log function
// ─────────────────────────────────────────────────────────────
const log = (level, module, message, meta = null) => {
  if (CONFIG.SHOW_IN_CONSOLE) {
    const ts    = getTimestamp();
    const emoji = EMOJI[level] || "📋";
    const style = STYLES[level] || "";
    const label = `[${ts}] ${emoji} [${level}] [${module}]`;

    if (level === LOG_LEVEL.ERROR) {
      console.error(`%c${label}`, style, message, meta ?? "");
    } else if (level === LOG_LEVEL.WARN) {
      console.warn(`%c${label}`, style, message, meta ?? "");
    } else {
      console.log(`%c${label}`, style, message, meta ?? "");
    }
  }

  // Non-blocking DB save
  saveToDb(level, module, message, meta);
};

// ─────────────────────────────────────────────────────────────
// PUBLIC API — import and use anywhere in the app
// ─────────────────────────────────────────────────────────────

/**
 * @param {string} module - e.g. "AssignTask", "whatsappService"
 * @param {string} message
 * @param {any}    [meta]  - extra data (object, array, etc.)
 */
export const logInfo = (module, message, meta = null) =>
  log(LOG_LEVEL.INFO, module, message, meta);

export const logWarn = (module, message, meta = null) =>
  log(LOG_LEVEL.WARN, module, message, meta);

export const logError = (module, message, meta = null) =>
  log(LOG_LEVEL.ERROR, module, message, meta);

export const logSuccess = (module, message, meta = null) =>
  log(LOG_LEVEL.SUCCESS, module, message, meta);

export const logDebug = (module, message, meta = null) =>
  log(LOG_LEVEL.DEBUG, module, message, meta);

// ─────────────────────────────────────────────────────────────
// CONVENIENCE: WhatsApp-specific logger
// ─────────────────────────────────────────────────────────────
export const logWhatsApp = {
  sent:    (to, template)    => logSuccess("WhatsApp", `Template [${template}] sent to ${to}`),
  failed:  (to, template, err) => logError("WhatsApp", `Template [${template}] failed for ${to}`, err),
  noPhone: (userName)        => logWarn("WhatsApp", `Phone not found for user: ${userName}`),
  skip:    (msg)             => logWarn("WhatsApp", msg),
};

// ─────────────────────────────────────────────────────────────
// CONVENIENCE: Supabase DB operation logger
// ─────────────────────────────────────────────────────────────
export const logDB = {
  fetched:  (table, count)   => logInfo("DB", `Fetched ${count ?? "?"} rows from [${table}]`),
  inserted: (table, id)      => logSuccess("DB", `Inserted into [${table}]`, { id }),
  updated:  (table, id)      => logSuccess("DB", `Updated [${table}]`, { id }),
  deleted:  (table, id)      => logSuccess("DB", `Deleted from [${table}]`, { id }),
  error:    (table, err)     => logError("DB", `Error on [${table}]`, err),
};

// ─────────────────────────────────────────────────────────────
// CONVENIENCE: Submission / checklist logger
// ─────────────────────────────────────────────────────────────
export const logSubmit = {
  start:   (count)           => logInfo("Submit", `Starting submission for ${count} task(s)`),
  success: (count)           => logSuccess("Submit", `${count} task(s) submitted successfully`),
  error:   (err)             => logError("Submit", "Submission failed", err),
  imageUploaded: (taskId)    => logSuccess("Submit", `Image uploaded for task ${taskId}`),
  imageFailed:   (taskId, e) => logError("Submit", `Image upload failed for task ${taskId}`, e),
};

// ─────────────────────────────────────────────────────────────
// OPTIONAL: Create this table in Supabase SQL Editor to enable
// persistent logging (CONFIG.SAVE_TO_DB = true):
//
// CREATE TABLE public.app_logs (
//   id         BIGSERIAL PRIMARY KEY,
//   level      TEXT,
//   module     TEXT,
//   message    TEXT,
//   meta       TEXT,
//   created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
// );
// ─────────────────────────────────────────────────────────────
