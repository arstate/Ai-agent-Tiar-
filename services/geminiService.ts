
import { GoogleGenAI } from "@google/genai";
import { MemoryItem, AgentSettings, ApiKeyEntry } from "../types";

const MODEL_ID = 'gemini-3-flash-preview';

/**
 * Helper to execute a Gemini call with key rotation logic.
 */
async function callGeminiWithRotation(
  keys: ApiKeyEntry[],
  task: (ai: GoogleGenAI) => Promise<any>
): Promise<any> {
  // Use the provided keys if available, otherwise fallback to process.env.API_KEY
  const availableKeys = (keys && keys.length > 0) 
    ? keys 
    : [{ id: 'env', key: process.env.API_KEY || '', label: 'Environment Key', createdAt: Date.now() }];

  // Shuffle keys to distribute load
  const shuffledKeys = [...availableKeys].sort(() => Math.random() - 0.5);
  let lastError: any = null;

  for (const keyEntry of shuffledKeys) {
    if (!keyEntry.key) continue;
    try {
      const ai = new GoogleGenAI({ apiKey: keyEntry.key });
      return await task(ai);
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.error?.code || 0;
      
      if (status === 429 || error?.message?.includes("429")) {
        console.warn(`Key ${keyEntry.label} rate limited. Rotating...`);
        continue;
      }
      
      if (status === 401 || status === 403) {
        console.error(`Invalid key: ${keyEntry.label}`);
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("All API keys failed. Please check your settings.");
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
      contents = { parts: [{ text: `Act as a Knowledge Architect. Analyze this text to extract core facts, rules, and logic for an AI agent's brain:\n\n${content}` }] };
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
            text: "Deeply analyze this document/image. Extract text, identified entities, patterns, and critical facts. Summarize it in a way that an AI agent can perfectly reference it later to answer customer questions."
          }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: contents,
    });

    return response.text || "No insights could be extracted.";
  });
};

/**
 * Generates an Agent response based on Settings, Memories, and Input.
 */
export const generateAgentResponse = async (
  clientInput: string,
  clientImageBase64: string | null,
  memories: MemoryItem[],
  settings: AgentSettings,
  apiKeys: ApiKeyEntry[]
): Promise<string> => {
  return await callGeminiWithRotation(apiKeys, async (ai) => {
    const knowledgeBase = memories.length > 0 
      ? memories.map(m => `[SOURCE: ${m.name}]\n${m.summary}`).join("\n\n---\n\n")
      : "No specific knowledge loaded. Use general intelligence.";

    const systemInstruction = `
      You are an intelligent AI Agent.
      ROLE: ${settings.role}
      TONE: ${settings.tone}
      LANGUAGE: ${settings.language}

      KNOWLEDGE BASE:
      ${knowledgeBase}

      INSTRUCTIONS:
      1. Use the provided KNOWLEDGE BASE as your primary source of truth.
      2. Keep responses natural, human-like, and professional.
      3. Use emojis where appropriate to maintain a friendly WhatsApp-like feel.
      4. If the answer isn't in the knowledge base, state that you don't know yet but can help with related topics.
    `;

    const parts: any[] = [];

    if (clientImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: clientImageBase64
        }
      });
      parts.push({ text: `Analyze the image provided by the user and respond to: "${clientInput || 'What is in this image?'}"` });
    } else {
      parts.push({ text: clientInput });
    }

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: { parts },
      config: {
        systemInstruction
      }
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  });
};
