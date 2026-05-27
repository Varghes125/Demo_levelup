const { supabase } = require("../../lib/supabaseClient.js");
const { handleCors } = require("../../utils/cors.js");

function getUserId(req) {
  return 1;
}

function isYesterday(dateStr) {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split("T")[0];
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getUserId(req);
  const { taskId } = req.body || {};

  if (!taskId) {
    return res.status(400).json({ error: "taskId is required" });
  }

  // 1. Fetch the task
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single();

  if (taskError || !task) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (task.completed) {
    return res.status(400).json({ error: "Task already completed" });
  }

  // 2. Mark task as complete
  const { error: updateTaskError } = await supabase
    .from("tasks")
    .update({ completed: true })
    .eq("id", taskId);

  if (updateTaskError) {
    return res.status(500).json({ error: updateTaskError.message });
  }

  // 3. Update domain: lastDone + streak
  const today = new Date().toISOString().split("T")[0];

  if (task.domain) {
    const { data: domain } = await supabase
      .from("domains")
      .select("*")
      .eq("user_id", userId)
      .eq("name", task.domain)
      .single();

    if (domain) {
      const domainStreak = isYesterday(domain.last_done)
        ? (domain.streak || 0) + 1
        : 1;

      await supabase
        .from("domains")
        .update({ last_done: today, streak: domainStreak })
        .eq("id", domain.id);
    }
  }

  // 4. Update user: xp + streak
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (user) {
    const userStreak = isYesterday(user.last_active_date)
      ? (user.streak || 0) + 1
      : user.last_active_date === today
      ? user.streak
      : 1;

    const newXp = (user.xp || 0) + (task.xp || 0);

    await supabase
      .from("users")
      .update({
        xp: newXp,
        streak: userStreak,
        last_active_date: today,
      })
      .eq("id", userId);
  }

  return res.status(200).json({
    success: true,
    taskId,
    xpAwarded: task.xp || 0,
    message: `Task completed! +${task.xp || 0} XP`,
  });
};
