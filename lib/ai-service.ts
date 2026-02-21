import db from './db';

export interface AIAnalysisResult {
    category: "technology" | "startup" | "ai" | "business" | "marketing" | "other";
    content_quality_score: number;
    engagement_score: number;
    virality_probability: number;
    recommended_platforms: string[];
    content_type_recommendation: string;
    reasoning: string;
    rewrite_needed: boolean;
}

export interface ProcessingStats {
    processed: number;
    approved: number;
    review: number;
    rejected: number;
    ai_errors: number;
    executionTimeMs: number;
}

export class AIService {
    private static GROQ_API_KEY = process.env.GROQ_API_KEY;
    private static GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    /**
     * Main entry point: Processes a batch of pending content
     */
    static async processBatch(batchSize: number = 10): Promise<ProcessingStats> {
        const startedAt = new Date();
        const batchId = crypto.randomUUID();
        const stats: ProcessingStats = {
            processed: 0,
            approved: 0,
            review: 0,
            rejected: 0,
            ai_errors: 0,
            executionTimeMs: 0
        };

        try {
            // 1. Fetch Pending Content
            const pendingItems = await db.contentQueue.findMany({
                where: { status: 'pending' },
                orderBy: { createdAt: 'asc' },
                take: batchSize
            });

            if (pendingItems.length === 0) {
                return stats;
            }

            console.log(`[AI-Service] Processing ${pendingItems.length} items...`);

            for (const item of pendingItems) {
                try {
                    // 2. Validate & Clean
                    const cleanedContent = this.cleanContent(item.rawContent || item.summary || "");

                    if (cleanedContent.length < 50) {
                        await this.saveRejection(item.id, "Validation Failed: Too short (<50 chars)");
                        stats.rejected++;
                        continue;
                    }

                    // 3. AI Analysis (with dynamic feedback loop learning)
                    const analysis = await this.analyzeWithAI(cleanedContent, item.userId);
                    if (!analysis) {
                        stats.ai_errors++;
                        continue;
                    }

                    // 4. Scoring & Decision
                    const finalScore = this.calculateFinalScore(analysis);
                    const { decision, reason } = this.makeDecision(finalScore, analysis);

                    // 5. Save Results
                    await this.saveAnalysisResults(item.id, analysis, finalScore, decision, reason);

                    // Update Stats
                    stats.processed++;
                    if (decision === 'approved') stats.approved++;
                    else if (decision === 'review') stats.review++;
                    else if (decision === 'rejected') stats.rejected++;

                } catch (error) {
                    console.error(`[AI-Service] Error processing item ${item.id}:`, error);
                    stats.ai_errors++;
                    await db.contentQueue.update({
                        where: { id: item.id },
                        data: {
                            aiStatus: 'ai_error',
                            decisionReason: String(error)
                        }
                    }).catch(() => { });
                }
            }

            // 6. Log Execution
            const finishedAt = new Date();
            stats.executionTimeMs = finishedAt.getTime() - startedAt.getTime();

            await db.aiProcessingLog.create({
                data: {
                    batchId,
                    batchSize,
                    processed: stats.processed,
                    approved: stats.approved,
                    review: stats.review,
                    rejected: stats.rejected,
                    aiErrors: stats.ai_errors,
                    executionTime: stats.executionTimeMs,
                    startedAt,
                    finishedAt
                }
            }).catch(e => console.error("[AI-Service] Log error:", e));

            return stats;

        } catch (error) {
            console.error("[AI-Service] Batch processing failed:", error);
            throw error;
        }
    }

    private static cleanContent(text: string): string {
        return text
            .replace(/<[^>]+>/g, '') // Strip HTML
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();
    }

    private static async analyzeWithAI(content: string, userId: string | null = null): Promise<AIAnalysisResult | null> {
        if (!this.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is missing in environment variables");
        }

        // Fetch dynamic learning feedback from previous posts
        let memoryRules = "";
        if (userId) {
            const pastLearnings = await db.aiLearningExample.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5 // Get top 5 recent learnings
            });

            if (pastLearnings.length > 0) {
                memoryRules = `\n\nCRITICAL AI MEMORY RULES (Based on past real-world performance for this user):\n` +
                    pastLearnings.map(l => `- [${l.category.toUpperCase()}] ${l.keyLearnings}`).join("\n") +
                    `\nApply these learnings strictly when deciding formatting, quality score, and rewrite necessity.`;
            }
        }

        const prompt = `
        Analyze the following content for strategic value.
        Content: ${content.substring(0, 4000)}${memoryRules}

        Return a JSON object with:
        - category: one of [technology, startup, ai, business, marketing, other]
        - content_quality_score: 0-100
        - engagement_score: 0-100
        - virality_probability: 0-100
        - recommended_platforms: list of strings
        - content_type_recommendation: string
        - reasoning: string explanation
        - rewrite_needed: boolean

        IMPORTANT: Response MUST be a valid JSON object only. No preamble or post-text.
        `;

        try {
            const response = await fetch(this.GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.2,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Groq API Error: ${response.status} - ${err}`);
            }

            const data = await response.json();
            const resultText = data.choices[0].message.content;
            return JSON.parse(resultText) as AIAnalysisResult;

        } catch (error) {
            console.error("[AI-Service] LLM Call failed:", error);
            return null;
        }
    }

    private static calculateFinalScore(analysis: AIAnalysisResult): number {
        const score = (
            (analysis.content_quality_score * 0.4) +
            (analysis.engagement_score * 0.3) +
            (analysis.virality_probability * 0.3)
        );
        return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
    }

    private static makeDecision(score: number, analysis: AIAnalysisResult): { decision: string, reason: string } {
        let decision = "rejected";
        let reason = `Score ${score} below threshold`;

        // Spam Check
        if (analysis.reasoning.toLowerCase().includes("spam") && score < 80) {
            return { decision: "rejected", reason: "AI flagged content as potential spam" };
        }

        // Threshold Rules
        if (score < 40) {
            decision = "rejected";
            reason = "Score < 40";
        } else if (score >= 40 && score < 70) {
            decision = "review";
            reason = "Score between 40 and 70 (Requires manual oversight)";
        } else {
            decision = "approved";
            reason = "High score (>= 70) - Automated Approval";
        }

        // Rewrite Check (Downgrade High Score if Rewrite Needed)
        if (decision === "approved" && analysis.rewrite_needed) {
            decision = "review";
            reason = "High score but AI suggests rewrite is needed";
        }

        return { decision, reason };
    }

    private static async saveRejection(id: string, reason: string) {
        await db.contentQueue.update({
            where: { id },
            data: {
                status: 'rejected',
                aiStatus: 'rejected',
                decisionReason: reason,
                analyzedAt: new Date()
            }
        });
    }

    private static async saveAnalysisResults(id: string, analysis: AIAnalysisResult, score: number, decision: string, reason: string) {
        // 1. Update content_queue
        await db.contentQueue.update({
            where: { id },
            data: {
                status: decision === 'approved' || decision === 'review' ? decision : 'rejected',
                aiStatus: decision,
                finalScore: score,
                decisionReason: reason,
                analyzedAt: new Date()
            }
        });

        // 2. Insert into content_ai_analysis
        await db.contentAiAnalysis.upsert({
            where: { contentId: id },
            create: {
                contentId: id,
                category: analysis.category,
                contentQualityScore: analysis.content_quality_score,
                engagementScore: analysis.engagement_score,
                viralityProbability: analysis.virality_probability,
                finalScore: score,
                recommendedPlatforms: analysis.recommended_platforms as any,
                contentTypeRecommendation: analysis.content_type_recommendation,
                rewriteNeeded: analysis.rewrite_needed,
                reasoning: analysis.reasoning,
                rawLlmResponse: analysis as any
            },
            update: {
                category: analysis.category,
                contentQualityScore: analysis.content_quality_score,
                engagementScore: analysis.engagement_score,
                viralityProbability: analysis.virality_probability,
                finalScore: score,
                recommendedPlatforms: analysis.recommended_platforms as any,
                contentTypeRecommendation: analysis.content_type_recommendation,
                rewriteNeeded: analysis.rewrite_needed,
                reasoning: analysis.reasoning,
                rawLlmResponse: analysis as any
            }
        });
    }

    /**
     * AI Feedback Loop: Analyzes post comments/engagement to extract sentiment and learning guidelines
     * for future content generation and evaluation.
     */
    static async extractLearningsFromFeedback(userId: string, postId: string, contentText: string, comments: string[]): Promise<boolean> {
        if (!this.GROQ_API_KEY || comments.length === 0) return false;

        const prompt = `
        You are a sophisticated social media AI intelligence learning system. 
        We posted the following content and received comments from real users.
        Analyze the overall sentiment of the comments. Did people like it (constructive, positive, engaging) or hate it (trolling, toxic, disagreement)?
        
        Original Post Content:
        "${contentText}"

        Real User Comments:
        ${comments.map(c => "- " + c).join("\n")}

        Identify what made this post succeed or fail.
        Return a JSON object with:
        - sentiment_score: 0 (extreme negative/hate) to 100 (extreme positive/love)
        - category: "positive" or "negative"
        - key_learnings: A short, 1-2 sentence concise instruction/rule on what to do (or avoid doing) in the future based on this post's specific performance.

        IMPORTANT: Response MUST be a valid JSON object only. No intro or outro text.
        `;

        try {
            const response = await fetch(this.GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                console.error("[AI-Service] Learning extraction API error:", response.statusText);
                return false;
            }

            const data = await response.json();
            const resultText = data.choices[0].message.content;
            const parsed = JSON.parse(resultText);

            // Save the extracted intelligence to the database
            await db.aiLearningExample.create({
                data: {
                    userId,
                    postId,
                    contentText,
                    sentimentScore: parsed.sentiment_score,
                    category: parsed.category === 'positive' || parsed.category === 'negative' ? parsed.category : 'neutral',
                    keyLearnings: parsed.key_learnings
                }
            });

            console.log(`[AI-Learning] Logic updated for post ${postId} (${parsed.category} sentiment)`);
            return true;

        } catch (error) {
            console.error("[AI-Service] Sentiment extraction failed:", error);
            return false;
        }
    }
}