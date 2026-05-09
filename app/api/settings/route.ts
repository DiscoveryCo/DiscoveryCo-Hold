import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

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
    include: { settings: true },
  })
  if (!inbox) return NextResponse.json({ error: "Inbox not found" }, { status: 404 })

  return NextResponse.json(inbox.settings ?? {})
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { inboxId, dndEnabled, dndFrom, dndTo, scheduleType, intervalHours, timesPerDay, timezone } = body

  const inbox = await prisma.inbox.findFirst({
    where: {
      id: inboxId,
      user: { email: session.user.email },
    },
  })
  if (!inbox) return NextResponse.json({ error: "Inbox not found" }, { status: 404 })

  const settings = await prisma.settings.upsert({
    where: { inboxId: inbox.id },
    update: { dndEnabled, dndFrom, dndTo, scheduleType, intervalHours, timesPerDay, timezone },
    create: {
      inboxId: inbox.id,
      dndEnabled: dndEnabled ?? false,
      dndFrom,
      dndTo,
      scheduleType: scheduleType ?? "custom_weekly",
      intervalHours,
      timesPerDay,
      timezone: timezone ?? "UTC",
    },
  })

  return NextResponse.json(settings)
}
