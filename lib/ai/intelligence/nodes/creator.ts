import { ChatGroq } from "@langchain/groq";
import { AgentStateType } from "../state";

/**
 * Agent 2: Content Creator
 * Generates the main post based on context and style.
 */
export async function creatorNode(state: AgentStateType) {
    console.log("[Intelligence-Graph] Starting CREATOR AGENT...");
    const { topic, audience, tone, context, memory } = state;

    if (!process.env.GROQ_API_KEY) {
        console.error("[Intelligence-Graph] ERROR: GROQ_API_KEY is missing in Creator Node");
        throw new Error("GROQ_API_KEY is missing");
    }

    const llm = new ChatGroq({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
    });

    const prompt = `
    You are a Creative Content Writer.
    
    Topic: ${topic}
    Audience: ${audience}
    Tone: ${tone}
    Research Context: ${context}
    Past Performance Learnings: ${memory.join("\n")}
    
    Task: Write a high-engagement social media post. 
    Focus on the "WOW" factor. Use micro-formatting, emojis, and a compelling hook.
    
    Return ONLY the post content.
  `;

    try {
        const response = await llm.invoke(prompt);
        const rawContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        console.log("[Intelligence-Graph] Creator Agent completed.");

        return {
            rawContent,
            nextAction: "orchestrate" as const,
        };
    } catch (error) {
        console.error("[Intelligence-Graph] Creator Agent FAILED:", error);
        throw error;
    }
}
