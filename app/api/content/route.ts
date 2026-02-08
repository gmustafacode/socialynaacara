import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = (session.user as any).id

    try {
        const queue = await db.contentQueue.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                postHistory: true // Include history just in case
            }
        })
        return NextResponse.json(queue)
    } catch (e) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await request.json()
        const { contentType, contentData, viralScore, source, sourceUrl, mediaUrl } = body
        const userId = (session.user as any).id

        const item = await db.contentQueue.create({
            data: {
                userId,
                contentType: contentType || 'text',
                source: source || 'manual', // Schema requires source
                sourceUrl: sourceUrl || null,
                title: contentData?.title || null,
                summary: contentData?.summary || null,
                rawContent: contentData?.text || contentData?.content || null,
                mediaUrl: mediaUrl || contentData?.mediaUrl || null,
                viralScore: viralScore || 0,
                status: 'pending'
            }
        })
        return NextResponse.json(item)
    } catch (e: any) {
        console.error("[Content API] Create Error:", e)
        return NextResponse.json({ error: "Creation failed: " + e.message }, { status: 500 })
    }
}
