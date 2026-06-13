import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Define the interface for the updates
interface MakautUpdate {
  title: string;
  type: 'notice' | 'exam_form' | 'result' | 'schedule' | 'announcement';
  url: string;
  date_published: string;
  content_hash: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Helper to generate a stable hash
async function generateHash(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Mock scraping/fetching logic from MAKAUT
async function fetchMakautUpdates(): Promise<MakautUpdate[]> {
  // In a real scenario, this would scrape the MAKAUT public website or hit their API.
  // We'll simulate fetching a few new notices here for the sake of the implementation.
  const today = new Date();
  
  const rawUpdates = [
    {
      title: "Notification for Even Semester Examinations 2026",
      type: "notice" as const,
      url: "https://makautwb.ac.in/notice_even_sem_2026.pdf",
      date_published: today.toISOString(),
      priority: "high" as const,
    },
    {
      title: "Results Published: 6th Semester CSE",
      type: "result" as const,
      url: "https://makautexam.net/results",
      date_published: today.toISOString(),
      priority: "urgent" as const,
    },
    {
      title: "Holiday List Update - June 2026",
      type: "announcement" as const,
      url: "https://makautwb.ac.in/holiday_list.pdf",
      date_published: new Date(today.getTime() - 86400000).toISOString(), // Yesterday
      priority: "normal" as const,
    }
  ];

  const updates: MakautUpdate[] = [];
  
  for (const raw of rawUpdates) {
    // Generate a unique hash based on the content to prevent duplicates
    const hash = await generateHash(`${raw.title}-${raw.type}-${raw.date_published}`);
    updates.push({
      ...raw,
      content_hash: hash
    });
  }

  return updates;
}

// Helper to send Expo Push Notifications
async function sendPushNotification(title: string, body: string, data: any) {
  try {
    // We would normally query Supabase for all user push tokens here.
    // For this implementation, we simulate the API call to Expo.
    // const { data: tokens } = await supabase.from('user_devices').select('push_token');
    
    // In a real scenario:
    // await fetch('https://exp.host/--/api/v2/push/send', { ... })
    
    console.log(`[Push Sent] ${title}: ${body}`, data);
  } catch (err) {
    console.error('Failed to send push notification', err);
  }
}

serve(async (req) => {
  // Only allow POST requests (usually invoked by cron or manually)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Initialize Supabase client with the Service Role key
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Starting MAKAUT sync process...");
  let itemsAdded = 0;

  try {
    // 1. Fetch updates
    const updates = await fetchMakautUpdates();
    console.log(`Fetched ${updates.length} updates from MAKAUT.`);

    if (updates.length > 0) {
      // 2. Upsert into Supabase (ignoring duplicates based on content_hash)
      const { data: insertedData, error: upsertError } = await supabase
        .from("makaut_updates")
        .upsert(updates, { onConflict: "content_hash", ignoreDuplicates: true })
        .select();

      if (upsertError) {
        throw new Error(`Failed to upsert updates: ${upsertError.message}`);
      }

      // `insertedData` only contains rows that were actually inserted (new rows)
      const newItems = insertedData || [];
      itemsAdded = newItems.length;
      console.log(`Successfully added ${itemsAdded} new items.`);

      // 3. Trigger Push Notifications for important new items
      for (const item of newItems) {
        if (item.priority === 'urgent' || item.priority === 'high' || item.type === 'result' || item.type === 'exam_form') {
          await sendPushNotification(
            "New MAKAUT Update 🎓",
            item.title,
            { url: item.url, type: item.type }
          );
        }
      }
    }

    // 4. Log Success
    await supabase.from("makaut_sync_logs").insert({
      status: "success",
      items_added: itemsAdded,
    });

    return new Response(
      JSON.stringify({ success: true, items_added: itemsAdded }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("MAKAUT sync failed:", err);
    
    // Log Failure
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("makaut_sync_logs").insert({
      status: "failed",
      error_message: errorMessage,
    });

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
