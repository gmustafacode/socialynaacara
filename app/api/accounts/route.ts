
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    try {
        const accounts = await db.socialAccount.findMany({
            where: { userId },
            select: {
                id: true,
                platform: true,
                platformAccountId: true,
                status: true,
                connectedAt: true,
                lastVerifiedAt: true,
                metadata: true,
                capabilities: true,
                encryptedClientId: true,
                encryptedClientSecret: true,
            }
        });

        const sanitizedAccounts = accounts.map(account => {
            const isEnterprise = !!account.encryptedClientId && !!account.encryptedClientSecret;
            const metadata = account.metadata ? JSON.parse(account.metadata) : {};

            // Standardize LinkedIn metadata fields
            if (account.platform === 'linkedin') {
                metadata.name = metadata.name || metadata.username || 'LinkedIn User';
                metadata.picture = metadata.picture || metadata.profilePicture || null;
            }

            return {
                id: account.id,
                platform: account.platform,
                platformAccountId: account.platformAccountId,
                status: account.status,
                connectedAt: account.connectedAt,
                lastVerifiedAt: account.lastVerifiedAt,
                capabilities: account.capabilities,
                metadata,
                isEnterprise
            };
        });

        return NextResponse.json(sanitizedAccounts);
    } catch (error) {
        console.error("Failed to fetch accounts:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
