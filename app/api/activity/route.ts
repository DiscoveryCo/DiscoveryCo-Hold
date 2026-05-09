import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const PAGE_SIZE = 15

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const inboxId = req.nextUrl.searchParams.get("inboxId")

  const inbox = await prisma.inbox.findFirst({
    where: {
      id: inboxId ?? undefined,
      user: { email: session.user.email },
    },
  })
  if (!inbox) return NextResponse.json({ error: "Inbox not found" }, { status: 404 })

  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10)
  const skip = (page - 1) * PAGE_SIZE

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { inboxId: inbox.id },
      orderBy: { deliveredAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.activityLog.count({ where: { inboxId: inbox.id } }),
  ])

  return NextResponse.json({
    logs,
    total,
    pages: Math.ceil(total / PAGE_SIZE),
    page,
  })
}
