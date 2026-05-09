import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getGmailClient, releaseEmails, stopWatch } from "@/lib/gmail"

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const inboxId = req.nextUrl.searchParams.get("inboxId")
  if (!inboxId) return NextResponse.json({ error: "inboxId required" }, { status: 400 })

  const inbox = await prisma.inbox.findFirst({
    where: { id: inboxId, user: { email: session.user.email } },
  })
  if (!inbox) return NextResponse.json({ error: "Inbox not found" }, { status: 404 })
  if (inbox.isPrimary) return NextResponse.json({ error: "Cannot remove primary inbox" }, { status: 400 })

  try {
    const gmail = await getGmailClient(inbox)
    if (inbox.holdLabelId) await releaseEmails(gmail, inbox.holdLabelId)
    await stopWatch(gmail)
  } catch {
    // non-fatal — continue with deletion
  }

  await prisma.inbox.delete({ where: { id: inboxId } })
  return NextResponse.json({ ok: true })
}
