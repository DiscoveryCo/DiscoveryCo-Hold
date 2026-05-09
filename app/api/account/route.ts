import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getGmailClient, releaseEmails, stopWatch } from "@/lib/gmail"

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { inboxes: true },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Release all held emails and stop watches before deleting
  for (const inbox of user.inboxes) {
    try {
      const gmail = await getGmailClient(inbox)
      if (inbox.holdLabelId) await releaseEmails(gmail, inbox.holdLabelId)
      await stopWatch(gmail)
    } catch {
      // non-fatal — continue
    }
  }

  // Deleting the user cascades to all inboxes, settings, schedules, rules, logs
  await prisma.user.delete({ where: { id: user.id } })

  return NextResponse.json({ ok: true })
}
