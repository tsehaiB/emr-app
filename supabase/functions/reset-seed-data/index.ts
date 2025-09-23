// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { emails } = await req.json()
    if (!emails || !Array.isArray(emails)) {
      throw new Error("Missing 'emails' array in request body.")
    }

    // Create Supabase admin client using the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const deletionLogs = []

    // Fetch all users from auth schema to find the ones to delete
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    const usersToDelete = users.filter(user => emails.includes(user.email))

    if (usersToDelete.length === 0) {
      deletionLogs.push("No matching seed users found to delete.")
    } else {
      for (const user of usersToDelete) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        if (deleteError) {
          deletionLogs.push(`Failed to delete user ${user.email}: ${deleteError.message}`)
        } else {
          deletionLogs.push(`Successfully deleted user ${user.email}.`)
        }
      }
    }

    return new Response(JSON.stringify({
      message: "Seed data reset process completed.",
      logs: deletionLogs
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})