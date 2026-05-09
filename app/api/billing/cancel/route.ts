import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { stripe } from "@/lib/stripe"

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account" }, { status: 404 })
  }

  // Find the active subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "active",
    limit: 1,
  })
  const sub = subscriptions.data[0]
  if (!sub) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 })
  }

  // Cancel at end of period (not immediately)
  await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true })

  return NextResponse.json({ ok: true })
}
