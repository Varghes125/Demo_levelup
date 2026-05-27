/**
 * /api/tasks/today
 * GET - Generate (or return cached) today's task for the user
 *
 * Flow:
 *  1. Fetch user
 *  2. Fetch domains
 *  3. Score domains
 *  4. If task already exists today → return it
 *  5. Otherwise → generate via OpenAI → store → return
 */

import { supabase } from "../../lib/supabaseClient.js";
import { getTodayTask } from "../../lib/taskEngine.js";
import { handleCors } from "../../utils/cors.js";

function getUserId(req) {
  return 1; // Replace with real auth later
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getUserId(req);

  // 1. Fetch user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return res.status(404).json({ error: "User not found" });
  }

  // 2. Fetch domains
  const { data: domains, error: domainsError } = await supabase
    .from("domains")
    .select("*")
    .eq("user_id", userId);

  if (domainsError) {
    return res.status(500).json({ error: domainsError.message });
  }

  if (!domains || domains.length === 0) {
    return res.status(400).json({ error: "User has no domains configured" });
  }

  // 3–5. Score + generate/return task
  try {
    const task = await getTodayTask(user, domains);
    return res.status(200).json(task);
  } catch (err) {
    console.error("[tasks/today] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate task" });
  }
}
