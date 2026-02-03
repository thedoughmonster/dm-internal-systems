import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type AppSettingsPayload = {
  key: string
}

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-internal-ui-secret",
  "access-control-allow-methods": "GET, POST, OPTIONS",
}

function getKeyFromRequest(request: Request): string | null {
  const url = new URL(request.url)
  const key = url.searchParams.get("key")
  if (key) return key
  return null
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (request.method !== "GET" && request.method !== "POST") {
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

    let key = getKeyFromRequest(request)
    if (!key && request.method === "POST") {
      const payload = (await request.json()) as AppSettingsPayload
      key = payload?.key
    }

    if (!key || typeof key !== "string") {
      return new Response(JSON.stringify({ error: "Invalid key" }), {
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
      .select("key, value, updated_at")
      .eq("key", key)
      .maybeSingle()

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
