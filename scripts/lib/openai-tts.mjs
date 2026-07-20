import { writeFile } from "node:fs/promises";

export const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";
export const TTS_MODEL = "gpt-4o-mini-tts";
export const TTS_VOICE = "marin";
export const TTS_RESPONSE_FORMAT = "mp3";

export async function generateOpenAiSpeechFile({ text, outputPath, instructions = null, apiKey }) {
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

  const response = await fetch(OPENAI_SPEECH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI TTS request failed (${response.status}): ${detail}`);
  }

  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}
