/**
 * /api/pathways
 * GET - Return all pathways for the user (general + domain-specific)
 */

import { supabase } from "../lib/supabaseClient.js";
import { handleCors } from "../utils/cors.js";

function getUserId(req) {
  return 1; // Replace with real auth later
}

// General pathway is always included as a meta-pathway
const GENERAL_PATHWAY = {
  id: "general",
  title: "Daily Life OS",
  domain: "General",
  totalSessions: null,
  currentSession: null,
  active: true,
  isGeneral: true,
};

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getUserId(req);

  const { data, error } = await supabase
    .from("pathways")
    .select("*")
    .eq("user_id", userId)
    .order("active", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const domainPathways = (data || []).map(formatPathway);

  return res.status(200).json([GENERAL_PATHWAY, ...domainPathways]);
}

function formatPathway(pathway) {
  return {
    id: pathway.id,
    title: pathway.title,
    domain: pathway.domain,
    totalSessions: pathway.total_sessions,
    currentSession: pathway.current_session,
    active: pathway.active,
    isGeneral: false,
  };
}
