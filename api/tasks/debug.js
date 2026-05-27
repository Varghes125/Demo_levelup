module.exports = async (req, res) => {
  const results = {};

  try {
    const { supabase } = require("../../lib/supabaseClient.js");

    // Test 1: Fetch domains
    const { data: domains, error: domainsError } = await supabase
      .from("domains")
      .select("*")
      .eq("user_id", 1);

    results.domains = domainsError 
      ? { error: domainsError.message } 
      : { count: domains.length, data: domains };

    if (!domains || domains.length === 0) {
      return res.status(200).json({ 
        ...results, 
        verdict: "NO DOMAINS — this is your problem" 
      });
    }

    // Test 2: Scoring
    try {
      const { pickBestDomain } = require("../../lib/scoring.js");
      const best = pickBestDomain(domains, null);
      results.scoring = { chosenDomain: best };
    } catch (e) {
      results.scoring = { error: e.message };
    }

    // Test 3: AI task generation
    try {
      const { generateTaskWithAI } = require("../../lib/taskEngine.js");
      const task = await generateTaskWithAI(
        { name: "Fitness", stage: "foundation" },
        "10min"
      );
      results.aiGeneration = { status: "ok", task };
    } catch (e) {
      results.aiGeneration = { error: e.message, stack: e.stack };
    }

    // Test 4: Full task insert into Supabase
    try {
      const { data: inserted, error: insertError } = await supabase
        .from("tasks")
        .insert({
          user_id: 1,
          domain: "Fitness",
          title: "Debug test task",
          why: "Testing insert",
          how: ["step 1", "step 2"],
          xp: 10,
          completed: false,
        })
        .select()
        .single();

      results.taskInsert = insertError 
        ? { error: insertError.message } 
        : { status: "ok", inserted };

      // Clean up test task
      if (inserted) {
        await supabase.from("tasks").delete().eq("id", inserted.id);
        results.taskInsert.cleaned = true;
      }
    } catch (e) {
      results.taskInsert = { error: e.message };
    }

  } catch (e) {
    results.fatalError = { error: e.message, stack: e.stack };
  }

  return res.status(200).json(results);
};
