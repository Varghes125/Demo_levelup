const { supabase } = require("../../lib/supabaseClient.js");
const { handleCors } = require("../../utils/cors.js");
const { getTodayTask } = require("../../lib/taskEngine.js");

function getUserId(req) {
  return 1;
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getUserId(req);

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return res.status(404).json({ error: "User not found" });
  }

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

  try {
    const task = await getTodayTask(user, domains);
    return res.status(200).json(task);
  } catch (err) {
    console.error("[tasks/today] Full error:", err);
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }
};
