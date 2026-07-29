import { rename, rm, writeFile } from "node:fs/promises";

export const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";
export const TTS_MODEL = "gpt-4o-mini-tts";
export const TTS_VOICE = "marin";
export const TTS_RESPONSE_FORMAT = "mp3";

const transientStatuses = new Set([408, 409, 429, 500, 502, 503, 504]);

export async function generateOpenAiSpeechFile({
  text,
  outputPath,
  instructions = null,
  apiKey,
  retries = 3
}) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate missing audio files.");
  }

  const requestBody = {
    model: TTS_MODEL,
    voice: TTS_VOICE,
    input: text,
    response_format: TTS_RESPONSE_FORMAT
  };
  if (instructions) requestBody.instructions = instructions;

  let response = null;
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      response = await fetch(OPENAI_SPEECH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      if (response.ok) break;
      const detail = await response.text().catch(() => "");
      lastError = new Error(`OpenAI TTS request failed (${response.status}): ${detail}`);
      if (!transientStatuses.has(response.status) || attempt === retries) throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt === retries || response && !transientStatuses.has(response.status)) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
  }

  if (!response?.ok) throw lastError || new Error("OpenAI TTS request failed.");
  const temporaryPath = `${outputPath}.part-${process.pid}-${Date.now()}`;
  try {
    await writeFile(temporaryPath, Buffer.from(await response.arrayBuffer()), { flag: "wx" });
    await rename(temporaryPath, outputPath);
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => {});
  }
}
