import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type PriceChangesPayload = {
  vendorId?: string
  days?: number
  minPercentChange?: number
  mode?: string
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

    const payload = (await request.json()) as PriceChangesPayload
    const mode = payload?.mode ?? "list"

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    if (mode === "default_vendor") {
      const { data, error } = await supabase
        .from("vendor_ingest_sessions")
        .select("vendor_id")
        .order("created_at", { ascending: false })
        .limit(1)
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

      return new Response(JSON.stringify({ vendorId: data?.vendor_id ?? null }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      })
    }

    if (!payload?.vendorId) {
      return new Response(JSON.stringify({ error: "Missing vendorId" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      })
    }

    const days = payload?.days ?? 28
    const minPercentChange = payload?.minPercentChange ?? 0.02

    const { data, error } = await supabase.rpc("vendor_price_changes_v1", {
      p_vendor_id: payload.vendorId,
      p_days: days,
      p_min_percent_change: minPercentChange,
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      })
    }

    return new Response(JSON.stringify(data ?? []), {
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
