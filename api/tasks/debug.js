module.exports = async (req, res) => {
  const results = {};

  // Test 1: Environment variables
  results.env = {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    hasGroqKey: !!process.env.GROQ_API_KEY,
  };

  // Test 2: Supabase import
  try {
    const { supabase } = require("../../lib/supabaseClient.js");
    results.supabaseImport = "ok";

    // Test 3: Supabase query
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", 1)
        .single();
      results.supabaseQuery = error ? { error: error.message } : { data };
    } catch (e) {
      results.supabaseQuery = { error: e.message };
    }

  } catch (e) {
    results.supabaseImport = { error: e.message };
  }

  // Test 4: OpenAI/Groq import
  try {
    const { openai } = require("../../lib/openaiClient.js");
    results.groqImport = "ok";

    // Test 5: Actual Groq API call
    try {
      const completion = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Reply with just the word: working" }],
        max_tokens: 10,
      });
      results.groqCall = {
        status: "ok",
        response: completion.choices[0].message.content,
      };
    } catch (e) {
      results.groqCall = { error: e.message };
    }

  } catch (e) {
    results.groqImport = { error: e.message };
  }

  // Test 6: taskEngine import
  try {
    require("../../lib/taskEngine.js");
    results.taskEngineImport = "ok";
  } catch (e) {
    results.taskEngineImport = { error: e.message };
  }

  return res.status(200).json(results);
};
