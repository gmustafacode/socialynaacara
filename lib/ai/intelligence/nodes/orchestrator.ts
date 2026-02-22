import { ChatGroq } from "@langchain/groq";
import { AgentStateType } from "../state";
import { safeParseJson } from "@/lib/utils/json-parser";

/**
 * Orchestrator Agent — Platform Tailoring
 * Takes the raw post and adapts it to each of the user's enabled platforms,
 * respecting platform character limits and per-platform content preferences.
 */
export async function orchestratorNode(state: AgentStateType) {
  console.log("[Intelligence-Graph] Starting ORCHESTRATOR AGENT...");
  const { rawContent, preferredPlatforms, platformPreferences, hashtagIntensity } = state;

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  // Only target platforms the user has enabled
  const activePlatforms = (preferredPlatforms?.length ? preferredPlatforms : ["linkedin"])
    .filter(p => {
      const pPref = platformPreferences?.[p];
      // If no preference object exists, default to enabled
      return pPref === undefined || pPref?.enabled !== false;
    });

  if (activePlatforms.length === 0) {
    console.warn("[Intelligence-Graph] No active platforms — defaulting to linkedin.");
    activePlatforms.push("linkedin");
  }

  const hashtagCountMap: Record<string, string> = {
    Low: "1-2",
    Medium: "3-5",
    High: "6-10",
  };
  const hashtagCount = hashtagCountMap[hashtagIntensity] || "3-5";

  const llm = new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0.2 });

  const prompt = `You are a Social Media Platform Specialist.
Adapt the following post for each of these platforms: ${activePlatforms.join(", ")}.

RAW POST:
${rawContent}

PLATFORM RULES:
- linkedin: Max 3000 chars. Professional. Include ${hashtagCount} hashtags. mediaRules: "Professional image or article link".
- instagram: Max 2200 chars. Visual-first. Include ${hashtagCount} hashtags. mediaRules: "High-quality image or Reel".
- tiktok: Max 150 chars for caption. Include ${hashtagCount} hashtags. mediaRules: "Short vertical video". 
- facebook: Max 63206 chars. Conversational. Include ${hashtagCount} hashtags. mediaRules: "Image or video".
- telegram: No strict limit. Informational. Optional hashtags only. mediaRules: "Image or document".
- twitter: Max 280 chars. Punchy. 1-2 hashtags. mediaRules: "Image or GIF".

Only return a JSON object for the active platforms listed. Format:
{
  "platform_name": { "text": "...", "hashtags": ["#tag1"], "mediaRules": "..." }
}

IMPORTANT: Return valid JSON only. No explanations.`;

  const response = await llm.invoke([
    ["system", "Respond with JSON only."],
    ["user", prompt],
  ]);

  const contentText = typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content);
  const platformContent = safeParseJson(contentText, {});

  return {
    platformContent,
    nextAction: "verify" as const,
  };
}
