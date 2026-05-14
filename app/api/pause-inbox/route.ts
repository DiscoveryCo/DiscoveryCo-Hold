import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { inboxId, until } = await req.json().catch(() => ({}))
  if (!inboxId) return NextResponse.json({ error: "Missing inboxId" }, { status: 400 })

  const inbox = await prisma.inbox.findFirst({
    where: { id: inboxId, user: { email: session.user.email } },
  })
  if (!inbox) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!inbox.isActive) return NextResponse.json({ error: "Inbox is not active" }, { status: 400 })

  const pausedUntil = until ? new Date(until) : null

  try {
    await prisma.inbox.update({
      where: { id: inboxId },
      data: { pausedUntil },
    })
  } catch (err) {
    console.error("pause-inbox error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ pausedUntil: pausedUntil?.toISOString() ?? null })
}
