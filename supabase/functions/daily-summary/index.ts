import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🚀 Starting Daily Summary Job...");

    // 1. Initialize Supabase Client (using Service Role to bypass RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
    const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;

    // 2. Get all active users
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("user_name, number")
      .eq("status", "active");

    if (userError) throw userError;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: "No active users found" }), { status: 200 });
    }

    console.log(`👤 Found ${users.length} active users.`);

    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

    const results = [];

    // 3. Loop through users and calculate stats
    for (const user of users) {
      const userName = user.user_name;
      const phoneNumber = user.number;

      if (!phoneNumber) {
        console.warn(`⚠️ Skipping ${userName}: No phone number.`);
        continue;
      }

      console.log(`📊 Calculating stats for ${userName}...`);

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

      // 4. Send WhatsApp via Meta API
      const phone = String(phoneNumber).replace(/\D/g, "");
      const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;

      const requestBody = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "daily_reminder",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: String(userName) },
                { type: "text", text: String(total) },
                { type: "text", text: String(pending) },
                { type: "text", text: String(todayCount) },
              ],
            },
          ],
        },
      };

      try {
        const response = await fetch(
          `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );
        const data = await response.json();
        console.log(`✅ Message sent to ${userName} (${formattedPhone})`);
        results.push({ user: userName, status: "sent", messageId: data.messages?.[0]?.id });
      } catch (err) {
        console.error(`❌ Failed to send to ${userName}:`, err);
        results.push({ user: userName, status: "failed", error: err.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Daily Summary Job Failed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
