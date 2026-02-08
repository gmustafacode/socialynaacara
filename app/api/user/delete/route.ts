import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"

export async function DELETE() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    try {
        // Since we have 'onDelete: Cascade' in our schema, 
        // deleting the user will automatically delete all related data.
        await db.user.delete({
            where: { id: userId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete user account:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
