import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type AppSettingsPayload = {
  key: string
  value: Record<string, unknown>
}

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-internal-ui-secret",
  "access-control-allow-methods": "POST, OPTIONS",
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
      },
    })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      })
    }

    const payload = (await request.json()) as AppSettingsPayload
    if (!payload?.key || typeof payload.key !== "string") {
      return new Response(JSON.stringify({ error: "Invalid key" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      })
    }

    if (!payload.value || typeof payload.value !== "object") {
      return new Response(JSON.stringify({ error: "Invalid value" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase
      .from("app_settings")
      .upsert({ key: payload.key, value: payload.value })
      .select("key, value, updated_at")
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
      },
    })
  }
})
