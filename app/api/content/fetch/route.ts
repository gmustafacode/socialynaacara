import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const webhookUrl = process.env.N8N_INGESTION_WEBHOOK_URL

        if (!webhookUrl) {
            console.error("Missing N8N_INGESTION_WEBHOOK_URL")
            return new NextResponse("Configuration Error: Missing Webhook URL", { status: 500 })
        }

        // Trigger the n8n webhook
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                trigger: "manual",
                userId: (session.user as any).id,
                timestamp: new Date().toISOString(),
            }),
        })

        if (!response.ok) {
            throw new Error(`n8n responded with ${response.status}`)
        }

        return NextResponse.json({
            success: true,
            message: "Content ingestion triggered successfully"
        })

    } catch (error) {
        console.error("[CONTENT_FETCH]", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
