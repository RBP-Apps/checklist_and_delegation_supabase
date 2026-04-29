import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Edge Function Received Payload:", JSON.stringify(payload));
    
    // Check if it's a template message or a text message
    const { to, templateName, components, message, languageCode = "en_US" } = payload;

    const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!WHATSAPP_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      console.error("Missing WhatsApp credentials in Supabase secrets");
      return new Response(
        JSON.stringify({ error: "Missing credentials" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Format phone number (ensure country code without +)
    const phone = String(to).replace(/\D/g, "");
    const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;

    let requestBody;
    
    if (templateName) {
      // Template Message Mode
      requestBody = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          ...(components && components.length > 0 && { components }),
        },
      };
    } else if (message) {
      // Fallback: Text Message Mode
      requestBody = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: message,
        },
      };
    } else {
      throw new Error("Must provide either 'templateName' or 'message'");
    }

    console.log("Sending to Meta API:", JSON.stringify(requestBody));

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
    console.log("Meta API Response:", JSON.stringify(data));

    if (!response.ok || data.error) {
      return new Response(JSON.stringify(data), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});