import { ChatGroq } from "@langchain/groq";
import { AgentStateType } from "../state";
import { safeParseJson } from "@/lib/utils/json-parser";

/**
 * Agent 3: Platform Orchestrator
 * Adapts the raw content to specific platform requirements.
 */
export async function orchestratorNode(state: AgentStateType) {
  console.log("[Intelligence-Graph] Starting ORCHESTRATOR AGENT...");
  const { rawContent } = state;

  if (!process.env.GROQ_API_KEY) {
    console.error("[Intelligence-Graph] ERROR: GROQ_API_KEY missing in Orchestrator Node");
    throw new Error("GROQ_API_KEY is missing");
  }

  const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
  });

  const prompt = `
    You are a Social Media Manager. Tailor the following post for LinkedIn, Instagram, and TikTok.
    Each platform has different rules for length, hashtags, and media context.
    
    RAW POST:
    ${rawContent}
    
    Return a JSON object:
    {
      "linkedin": { "text": "...", "hashtags": ["#tag1"], "mediaRules": "Professional image/link" },
      "instagram": { "text": "...", "hashtags": ["#tag1"], "mediaRules": "Vibrant visual/Reel" },
      "tiktok": { "text": "...", "hashtags": ["#tag1"], "mediaRules": "Short video/Hook" }
    }
  `;

  const response = await llm.invoke([
    ["system", "Respond with JSON only."],
    ["user", prompt]
  ]);

  const contentText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
  const platformContent = safeParseJson(contentText, {});

  return {
    platformContent,
    nextAction: "verify" as const,
  };
}
