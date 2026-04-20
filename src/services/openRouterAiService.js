// ── OpenRouter AI Service ───────────────────────────────────
import AppError from "../utils/AppError.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// export const PRIMARY_MODEL = "openai/gpt-oss-120b:free";
export const PRIMARY_MODEL = "meta-llama/llama-3.1-70b-instruct";
// export const FALLBACK_MODEL = "meta-llama/llama-3.1-70b-instruct";
export const FALLBACK_MODEL = "openai/gpt-oss-120b:free";

const REQUEST_TIMEOUT_MS = 120_000;

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Extract and repair JSON from AI response.
 * Handles: code fences, trailing commas, single quotes, control chars.
 */
const extractJSON = (text) => {
  let cleaned = text.trim();

  // Remove markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  } else {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      cleaned = cleaned.substring(start, end + 1);
    }
  }

  // Fix trailing commas before } or ] (common AI mistake)
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  // Fix single-quoted strings → double quotes (crude but effective)
  // Only if JSON.parse would fail
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // Try replacing single quotes
    cleaned = cleaned.replace(/'/g, '"');
  }

  return cleaned;
};

/**
 * Send request to OpenRouter
 */
const sendRequest = async (model, systemPrompt, userMessage, temperature) => {
  const apiKey = process.env.OPEN_ROUTER_SECRET_KEY;
  if (!apiKey) throw new AppError("OpenRouter API key not configured", 500);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature,
        max_tokens: 16384,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "Unknown");
      const err = new Error(
        `OpenRouter ${res.status}: ${body.substring(0, 200)}`,
      );
      err.statusCode = res.status;
      throw err;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    return content;
  } catch (err) {
    if (err.name === "AbortError") {
      const e = new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`,
      );
      e.statusCode = 408;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Call AI: try PRIMARY once → if fails → try FALLBACK once.
 *
 * @param {object} prompts - { primary: { system, user }, fallback: { system, user } }
 * @returns {object} Parsed JSON response
 */
export const callAI = async (prompts) => {
  const attempts = [
    { model: PRIMARY_MODEL, prompt: prompts.primary, temp: 0.3 },
    { model: FALLBACK_MODEL, prompt: prompts.fallback, temp: 0.3 },
  ];

  let lastError = null;

  for (const { model, prompt, temp } of attempts) {
    try {
      console.log(`🤖 AI → ${model}`);
      const raw = await sendRequest(model, prompt.system, prompt.user, temp);

      // Parse JSON
      const json = extractJSON(raw);
      try {
        return JSON.parse(json);
      } catch (parseErr) {
        console.error(`⚠️ JSON parse failed:`, parseErr.message);
        console.error(`   Preview: ${json.substring(0, 300)}`);
        throw new Error(`Invalid JSON from AI: ${parseErr.message}`);
      }
    } catch (err) {
      lastError = err;
      console.error(`❌ Failed (${model}): ${err.message}`);
      console.log(`🔄 Switching to fallback...`);
    }
  }

  throw new AppError(`AI service failed: ${lastError?.message}`, 503);
};
