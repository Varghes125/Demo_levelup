/**
 * /api/user
 * GET  - Fetch current user profile
 * PATCH - Update user preferences
 *
 * Note: For now uses a placeholder user ID (1).
 * Structured to easily swap in auth (e.g. Supabase JWT) later.
 */

const { supabase } = require("../lib/supabaseClient.js");
const { handleCors } = require("../utils/cors.js");

// Placeholder: replace with real auth extraction later
function getUserId(req) {
  return 1;
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, xp, streak, time_availability, last_active_date")
      .eq("id", userId)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      id: data.id,
      name: data.name,
      xp: data.xp,
      streak: data.streak,
      timeAvailability: data.time_availability,
      lastActiveDate: data.last_active_date,
    });
  }

  if (req.method === "PATCH") {
    const { timeAvailability, preferences } = req.body || {};

    const updates = {};
    if (timeAvailability !== undefined) updates.time_availability = timeAvailability;
    if (preferences !== undefined) updates.preferences = preferences;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("id, name, xp, streak, time_availability, last_active_date")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({
      id: data.id,
      name: data.name,
      xp: data.xp,
      streak: data.streak,
      timeAvailability: data.time_availability,
      lastActiveDate: data.last_active_date,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
