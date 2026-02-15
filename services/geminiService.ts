
import { GoogleGenAI } from "@google/genai";
import { MemoryItem, AgentSettings, ApiKeyEntry } from "../types";

const MODEL_ID = 'gemini-2.5-flash-native-audio-preview-12-2025';

/**
 * Helper to execute a Gemini call with key rotation logic.
 * Tries keys one by one if a 429 (Rate Limit) is encountered.
 */
async function callGeminiWithRotation(
  keys: ApiKeyEntry[],
  task: (ai: GoogleGenAI) => Promise<any>
): Promise<any> {
  if (!keys || keys.length === 0) {
    // Fallback to process.env.API_KEY if no keys in DB
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    return await task(ai);
  }

  // Shuffle keys to distribute load
  const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);
  let lastError: any = null;

  for (const keyEntry of shuffledKeys) {
    try {
      const ai = new GoogleGenAI({ apiKey: keyEntry.key });
      return await task(ai);
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.error?.code || 0;
      
      // If it's a rate limit error (429), try the next key
      if (status === 429 || error?.message?.includes("429")) {
        console.warn(`Key ${keyEntry.label} rate limited. Rotating...`);
        continue;
      }
      
      // If it's another error (like invalid key), we might want to rotate too or just throw
      console.error(`Error with key ${keyEntry.label}:`, error);
      if (status === 401 || status === 403) continue;

      throw error;
    }
  }

  throw lastError || new Error("All API keys failed or were rate limited.");
}

/**
 * Analyzes uploaded content (Image, PDF, Text) to create a memory summary.
 */
export const analyzeContent = async (
  type: 'text' | 'image' | 'pdf',
  content: string, // Base64 or text
  apiKeys: ApiKeyEntry[],
  mimeType?: string
): Promise<string> => {
  return await callGeminiWithRotation(apiKeys, async (ai) => {
    let contents: any = {};

    if (type === 'text') {
      contents = { parts: [{ text: `Analyze, interpret, and summarize this text comprehensively for a knowledge base:\n\n${content}` }] };
    } else {
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || (type === 'image' ? 'image/png' : 'application/pdf'),
              data: content
            }
          },
          {
            text: "Analyze this document/image. Extract text and key details to build a usable knowledge base entry for an AI agent."
          }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: contents,
    });

    return response.text || "No analysis generated.";
  });
};

/**
 * Generates a WhatsApp response based on Agent Role, Memories, and Client Input.
 */
export const generateAgentResponse = async (
  clientInput: string,
  clientImageBase64: string | null,
  memories: MemoryItem[],
  settings: AgentSettings,
  apiKeys: ApiKeyEntry[]
): Promise<string> => {
  return await callGeminiWithRotation(apiKeys, async (ai) => {
    const knowledgeBase = memories.map(m => `[Memory: ${m.name}]\n${m.summary}`).join("\n\n");

    const systemPrompt = `
      You are an expert AI Agent:
      Role: ${settings.role}
      Tone: ${settings.tone}
      Language: ${settings.language}

      GOAL: Draft a perfect WhatsApp reply using ONLY the Knowledge Base below.
      
      KNOWLEDGE BASE:
      ${knowledgeBase}

      INSTRUCTIONS:
      - Concise, friendly, use emojis.
      - If unknown, ask for clarification.
    `;

    const parts: any[] = [{ text: systemPrompt }];

    if (clientImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: clientImageBase64
        }
      });
      parts.push({ text: `Analyze the client's image and caption: "${clientInput}" and reply accordingly.` });
    } else {
      parts.push({ text: `Client Message: "${clientInput}"` });
    }

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: { parts },
    });

    return response.text || "I couldn't generate a response.";
  });
};
