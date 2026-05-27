const { openai } = require("./openaiClient.js");
const { supabase } = require("./supabaseClient.js");
const { pickBestDomain } = require("./scoring.js");

async function generateTaskWithAI(domain, timeAvailability) {
  const prompt = `Generate a single real-world micro-task for personal growth.

Domain: ${domain.name}
Stage: ${domain.stage || "foundation"}
Time limit: ${timeAvailability || "10min"}

Rules:
- Must be executable today
- Must fit within the time limit
- Must be practical and specific (not vague)
- Must slightly challenge the user without overwhelming them
- Must NOT be repetitive or generic

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "title": "Short action title (under 10 words)",
  "why": "One sentence explaining the benefit",
  "how": ["Step 1", "Step 2", "Step 3"],
  "xp": 10
}`;

  const completion = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 300,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0].message.content;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Groq returned invalid JSON: " + raw);
  }

  return {
    title: parsed.title || "Complete your daily micro-task",
    why: parsed.why || "Build consistency in your growth journey.",
    how: Array.isArray(parsed.how) ? parsed.how : ["Follow the task steps carefully."],
    xp: typeof parsed.xp === "number" ? parsed.xp : 10,
  };
}

async function getTodayTask(user, domains) {
  const today = new Date().toISOString().split("T")[0];

  const { data: existingTasks, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", false)
    .gte("created_at", `${today}T00:00:00.000Z`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (fetchError) throw fetchError;

  if (existingTasks && existingTasks.length > 0) {
    return formatTask(existingTasks[0]);
  }

  const { data: lastTask } = await supabase
    .from("tasks")
    .select("domain")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const lastDomainName = lastTask?.[0]?.domain || null;
  const lastDomain = lastDomainName
    ? domains.find((d) => d.name === lastDomainName)
    : null;

  const chosenDomain = pickBestDomain(domains, lastDomain?.id);
  if (!chosenDomain) throw new Error("No domains found for user");

  const aiTask = await generateTaskWithAI(chosenDomain, user.time_availability);

  const { data: newTask, error: insertError } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      domain: chosenDomain.name,
      pathway_id: null,
      title: aiTask.title,
      why: aiTask.why,
      how: aiTask.how,
      xp: aiTask.xp,
      completed: false,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return formatTask(newTask);
}

function formatTask(task) {
  return {
    id: task.id,
    type: task.pathway_id ? "pathway" : "general",
    domain: task.domain,
    title: task.title,
    why: task.why,
    how: Array.isArray(task.how) ? task.how : JSON.parse(task.how || "[]"),
    xp: task.xp,
    time: "10 min",
    completed: task.completed,
    createdAt: task.created_at,
  };
}

module.exports = { generateTaskWithAI, getTodayTask };
