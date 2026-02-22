import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentState } from "./state";
import { searchNode } from "./nodes/search";
import { creatorNode } from "./nodes/creator";
import { orchestratorNode } from "./nodes/orchestrator";
import { safetyNode } from "./nodes/safety";
import { analyticsNode } from "./nodes/analytics";
import { learningNode } from "./nodes/learning";

/**
 * The Socialyncara Intelligence Graph
 * Orchestrates the full post-generation pipeline.
 */
const workflow = new StateGraph(AgentState)
    .addNode("search", searchNode)
    .addNode("generate", creatorNode)
    .addNode("orchestrate", orchestratorNode)
    .addNode("verify", safetyNode)
    .addNode("analyze", analyticsNode)
    .addNode("learn", learningNode);

// Edge Definitions
workflow.addEdge(START, "search");
workflow.addEdge("search", "generate");
workflow.addEdge("generate", "orchestrate");
workflow.addEdge("orchestrate", "verify");

// Conditional Edge for Safety
workflow.addConditionalEdges(
    "verify",
    (state) => state.nextAction === "analyze" ? "analyze" : END
);

workflow.addEdge("analyze", "learn");
workflow.addEdge("learn", END);

// Compile the graph
export const intelligenceGraph = workflow.compile();
