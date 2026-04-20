import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parseICS(text: string) {
  const events: any[] = []
  const blocks = text.split('BEGIN:VEVENT')
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]
    const get = (key: string) => {
      const match = block.match(new RegExp(`${key}[^:]*:(.+)`))
      return match ? match[1].trim() : null
    }
    const uid = get('UID')
    const summary = get('SUMMARY')
    const dtstart = get('DTSTART')
    if (!dtstart) continue

    const isDateTime = dtstart.includes('T')
    const d = isDateTime
      ? new Date(dtstart.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/, '$1-$2-$3T$4:$5:$6Z'))
      : new Date(dtstart.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))

    if (isNaN(d.getTime())) continue
    events.push({ uid, summary, start: d })
  }
  return events
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    console.log("Function started")
    const { user_id } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: profile } = await supabase.from('profiles').select('ics_url').eq('id', user_id).single()
    if (!profile?.ics_url) throw new Error("Missing ICS URL in profile")

    const icsResponse = await fetch(profile.ics_url)
    const icsText = await icsResponse.text()
    console.log("ICS fetched, length:", icsText.length)

    const events = parseICS(icsText)
    console.log("Parsed events:", events.length)

    const upsertData = events.map((event) => {
      // Offset to UTC+8 (Malaysia) before splitting date/time
      const d = new Date(event.start.getTime() + 8 * 60 * 60 * 1000)
      return {
        user_id,
        external_id: event.uid || `manual-${d.getTime()}`,
        title: (event.summary || 'CALENDAR EVENT').toUpperCase(),
        start_time: d.toISOString().split('T')[1].split('.')[0],
        task_date: d.toISOString().split('T')[0],
        is_ics_event: true,
      }
    })

    console.log("Sample upsert:", upsertData[0])

    const { error: dbError } = await supabase.from('schedules').upsert(upsertData, { onConflict: 'external_id' })

    if (dbError) {
      console.error("DB Error:", dbError.message)
      return new Response(JSON.stringify({ error: dbError.message }), { headers: corsHeaders, status: 200 })
    }

    return new Response(JSON.stringify({ success: true, count: upsertData.length }), { headers: corsHeaders })

  } catch (err: any) {
    console.error("Crash:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { headers: corsHeaders, status: 200 })
  }
})