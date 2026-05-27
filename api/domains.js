/**
 * /api/domains
 * GET  - Fetch all domains for the user
 * POST - Create a custom domain
 *
 * /api/domains/:id  (handled via query param ?id=)
 * PATCH - Update domain priority or stage
 */

const { supabase } = require("../lib/supabaseClient.js");
const { handleCors } = require("../utils/cors.js");

function getUserId(req) {
  return 1; // Replace with real auth later
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  const domainId = req.query?.id;

  // PATCH /api/domains?id=:id
  if (req.method === "PATCH" && domainId) {
    const { priority, stage } = req.body || {};
    const updates = {};
    if (priority !== undefined) updates.priority = priority;
    if (stage !== undefined) updates.stage = stage;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const { data, error } = await supabase
      .from("domains")
      .update(updates)
      .eq("id", domainId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Domain not found" });

    return res.status(200).json(formatDomain(data));
  }

  // GET /api/domains
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("domains")
      .select("*")
      .eq("user_id", userId)
      .order("priority", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json((data || []).map(formatDomain));
  }

  // POST /api/domains
  if (req.method === "POST") {
    const { name, icon } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: "Domain name is required" });
    }

    const { data, error } = await supabase
      .from("domains")
      .insert({
        user_id: userId,
        name,
        icon: icon || "📌",
        stage: "foundation",
        priority: "medium",
        last_done: null,
        streak: 0,
        is_custom: true,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json(formatDomain(data));
  }

  return res.status(405).json({ error: "Method not allowed" });
}

function formatDomain(domain) {
  return {
    id: domain.id,
    name: domain.name,
    icon: domain.icon,
    stage: domain.stage,
    priority: domain.priority,
    lastDone: domain.last_done,
    streak: domain.streak,
    isCustom: domain.is_custom,
  };
}
