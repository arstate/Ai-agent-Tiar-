import { GoogleGenAI } from "@google/genai";
import { MemoryItem, AgentSettings } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes uploaded content (Image, PDF, Text) to create a memory summary.
 */
export const analyzeContent = async (
  type: 'text' | 'image' | 'pdf',
  content: string, // Base64 or text
  mimeType?: string
): Promise<string> => {
  try {
    const modelId = 'gemini-3-flash-preview'; // Good all-rounder for analysis

    let contents: any = {};

    if (type === 'text') {
      contents = { parts: [{ text: `Analyze, interpret, and summarize this text. Translate key data points into clear English/Indonesian if necessary for better understanding. Provide a comprehensive summary of facts, rules, and data that an AI agent should memorize:\n\n${content}` }] };
    } else {
      // Image or PDF
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || (type === 'image' ? 'image/png' : 'application/pdf'),
              data: content
            }
          },
          {
            text: "Analyze this document/image. Extract all visible text, identify key objects, and summarize the intent and details. Interpret the data and translate if needed to provide a clear, usable knowledge base entry."
          }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
    });

    return response.text || "No analysis generated.";

  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Failed to analyze content using Gemini.");
  }
};

/**
 * Generates a WhatsApp response based on Agent Role, Memories, and Client Input.
 */
export const generateAgentResponse = async (
  clientInput: string,
  clientImageBase64: string | null, // Screenshot or image sent by client
  memories: MemoryItem[],
  settings: AgentSettings
): Promise<string> => {
  try {
    // 1. Construct Knowledge Context
    const knowledgeBase = memories.map(m => `[Memory: ${m.name}]\n${m.summary}`).join("\n\n");

    // 2. Build Prompt
    const systemPrompt = `
      You are an expert AI Agent acting with the following persona:
      Role: ${settings.role}
      Tone: ${settings.tone}
      Language: ${settings.language}

      YOUR GOAL:
      Generate a perfect reply for a WhatsApp client based on their message and your internal knowledge base.
      Do not invent facts. Use the Knowledge Base below. If the answer isn't in the knowledge base, politely ask for more info or offer to check.

      KNOWLEDGE BASE (Internal Memory):
      ${knowledgeBase}

      INSTRUCTIONS:
      - Keep the response concise, friendly, and formatted for WhatsApp (use emojis if tone permits).
      - Directly address the client's query.
    `;

    const parts: any[] = [{ text: systemPrompt }];

    // 3. Add Client Input
    if (clientImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/png', // Assuming PNG/JPEG for screenshots
          data: clientImageBase64
        }
      });
      parts.push({ text: `Client sent this image/screenshot with caption: "${clientInput}". Analyze the image carefully to understand their question or issue.` });
    } else {
      parts.push({ text: `Client Message: "${clientInput}"` });
    }

    // Use Gemini 3 Flash for fast, reasoning-based chat
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
    });

    return response.text || "I couldn't generate a response.";

  } catch (error) {
    console.error("Response Generation Error:", error);
    return "Error: Unable to connect to AI service.";
  }
};