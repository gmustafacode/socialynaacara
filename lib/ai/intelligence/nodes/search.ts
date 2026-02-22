import { ChatGroq } from "@langchain/groq";
import { AgentStateType } from "../state";

/**
 * Agent 1: Context Collector
 * Analyzes the topic and user niche to find relevant information.
 */
export async function searchNode(state: AgentStateType) {
    console.log("[Intelligence-Graph] Starting SEARCH AGENT: Topic =", state.topic);
    const { topic, audience, memory } = state;

    if (!process.env.GROQ_API_KEY) {
        console.error("[Intelligence-Graph] ERROR: GROQ_API_KEY is missing!");
        throw new Error("GROQ_API_KEY is missing");
    }

    const llm = new ChatGroq({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
    });

    const prompt = `
    You are a Research Assistant. Your goal is to provide deep context for a social media post.
    
    User Topic: ${topic}
    Target Audience: ${audience}
    Past Learnings/Context: ${memory.join("\n")}
    
    Provide a concise research summary (max 300 words) that includes:
    1. Current trends related to this topic.
    2. Key pain points for the target audience.
    3. Unique angles to make the post stand out.
  `;

    const response = await llm.invoke(prompt);
    const context = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    return {
        context,
        nextAction: "generate" as const,
    };
}
