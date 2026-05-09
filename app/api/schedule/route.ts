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
    include: { schedules: true },
  })
  if (!inbox) return NextResponse.json({ error: "Inbox not found" }, { status: 404 })

  return NextResponse.json(inbox.schedules)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { inboxId, slots } = body as { inboxId: string; slots: { dayOfWeek: number; time: string }[] }

  const inbox = await prisma.inbox.findFirst({
    where: {
      id: inboxId,
      user: { email: session.user.email },
    },
  })
  if (!inbox) return NextResponse.json({ error: "Inbox not found" }, { status: 404 })

  await prisma.schedule.deleteMany({ where: { inboxId: inbox.id } })
  const created = await prisma.schedule.createMany({
    data: slots.map((s) => ({ inboxId: inbox.id, dayOfWeek: s.dayOfWeek, time: s.time })),
  })

  return NextResponse.json({ count: created.count })
}
