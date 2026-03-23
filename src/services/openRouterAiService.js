// ── OpenRouter AI Client with Fallback & Retry ──────────────
import AppError from "../utils/AppError.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_MODEL = "anthropic/claude-3.5-sonnet";
const FALLBACK_MODEL = "meta-llama/llama-3.1-70b-instruct";

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

/**
 * Sleep helper for exponential backoff
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Strip markdown code fences from AI response
 */
const stripCodeFences = (text) => {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  return cleaned.trim();
};

/**
 * Send a chat completion request to OpenRouter
 * @param {string} model - The model identifier
 * @param {string} systemPrompt - System-level instructions
 * @param {string} userMessage - The user-level message/data
 * @returns {string} Raw AI response content
 */
const sendRequest = async (model, systemPrompt, userMessage) => {
  const apiKey = process.env.OPEN_ROUTER_SECRET_KEY;

  if (!apiKey) {
    throw new AppError("OpenRouter API key is not configured", 500);
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
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
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    const err = new Error(
      `OpenRouter ${response.status}: ${errorBody.substring(0, 200)}`
    );
    err.statusCode = response.status;
    throw err;
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error("Empty response from OpenRouter AI");
  }

  return data.choices[0].message.content;
};

/**
 * Call AI with retry + model fallback logic
 *
 * Flow:
 *  1. Try primary model (up to MAX_RETRIES with exponential backoff)
 *  2. If primary exhausted → try fallback model (up to MAX_RETRIES)
 *  3. If all fail → throw AppError
 *
 * @param {string} systemPrompt - System instructions for the AI
 * @param {string} userMessage - The data/question for the AI
 * @param {object} [options] - Optional config
 * @param {boolean} [options.parseJson=true] - Whether to parse response as JSON
 * @returns {object|string} Parsed JSON or raw string response
 */
export const callAI = async (systemPrompt, userMessage, options = {}) => {
  const { parseJson = true } = options;
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];

  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `🤖 AI request → model: ${model}, attempt: ${attempt}/${MAX_RETRIES}`
        );

        const rawContent = await sendRequest(model, systemPrompt, userMessage);

        if (!parseJson) {
          return rawContent;
        }

        // Parse JSON from AI response
        const cleaned = stripCodeFences(rawContent);
        try {
          return JSON.parse(cleaned);
        } catch (parseErr) {
          console.error(`⚠️ JSON parse failed (model: ${model}):`, parseErr.message);
          console.error(`   Raw content: ${cleaned.substring(0, 300)}`);
          throw new Error(`AI returned invalid JSON: ${parseErr.message}`);
        }
      } catch (err) {
        lastError = err;
        console.error(
          `❌ AI call failed (model: ${model}, attempt ${attempt}): ${err.message}`
        );

        // If retryable (429, 5xx, network) and not last attempt → backoff
        const isRetryable =
          err.statusCode === 429 ||
          (err.statusCode >= 500 && err.statusCode < 600) ||
          !err.statusCode;

        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await sleep(delay);
        } else if (!isRetryable) {
          // Non-retryable error (e.g. 400, 401) → skip to fallback model
          break;
        }
      }
    }
    console.log(`🔄 Switching to next model fallback...`);
  }

  // All models and retries exhausted
  throw new AppError(
    `AI service unavailable after all retries: ${lastError?.message || "Unknown error"}`,
    503
  );
};

export default { callAI };
