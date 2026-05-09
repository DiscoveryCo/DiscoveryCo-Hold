import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Mail, ArrowLeft } from "lucide-react"
import { UserMenu } from "@/components/UserMenu"
import { format } from "date-fns"
import { RemoveInboxButton, DeleteAccountButton } from "@/components/AccountClient"

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      inboxes: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
    },
  })
  if (!user) redirect("/login")

  const joinDate = format(user.createdAt, "MMM d, yyyy")
  const primaryInbox = user.inboxes.find((i) => i.isPrimary) ?? user.inboxes[0]

  const subStatus = user.subscriptionStatus ?? "trialing"
  const trialDaysLeft = subStatus === "trialing" && user.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const subBadge =
    subStatus === "active"
      ? { label: "Subscribed", classes: "bg-green-50 text-green-600" }
      : subStatus === "trialing"
      ? { label: trialDaysLeft !== null ? `Trial · ${trialDaysLeft}d left` : "Trial", classes: "bg-[#ededff] text-[#7c7cf8]" }
      : subStatus === "past_due"
      ? { label: "Payment failed", classes: "bg-red-50 text-red-500" }
      : { label: "Expired", classes: "bg-gray-100 text-gray-400" }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
          <Mail className="w-5 h-5 text-[#7c7cf8]" />
          <span className="font-bold text-lg tracking-tight text-gray-900">DiscoveryMail</span>
        </Link>
        <div className="ml-auto">
          <UserMenu email={user.email} image={user.image ?? null} settingsHref="/settings" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Account</h1>

        {/* Profile */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-4">
            {primaryInbox?.image && (
              <Image
                src={primaryInbox.image}
                alt=""
                width={64}
                height={64}
                className="rounded-xl"
              />
            )}
            <div>
              <p className="font-semibold text-gray-900 text-lg">{primaryInbox?.name ?? user.name}</p>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <p className="text-gray-400 text-xs mt-0.5">Member since {joinDate}</p>
            </div>
          </div>
        </div>

        {/* Connected inboxes */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-1">Inboxes</h2>
          <p className="text-sm text-gray-500 mb-4">All your connected Gmail accounts.</p>

          <div className="space-y-3">
            {user.inboxes.map((inbox) => (
              <div
                key={inbox.id}
                className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
              >
                {inbox.image ? (
                  <Image src={inbox.image} alt="" width={40} height={40} className="rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm truncate">{inbox.name}</span>
                    {inbox.isPrimary && (
                      <span className="text-xs bg-[#ededff] text-[#7c7cf8] font-medium px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                    {inbox.isPrimary && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${subBadge.classes}`}>
                        {subBadge.label}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      inbox.isActive
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      {inbox.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{inbox.email}</p>
                </div>
                {!inbox.isPrimary && (
                  <RemoveInboxButton inbox={inbox} />
                )}
              </div>
            ))}
          </div>

          <Link
            href="/connect-inbox"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#7c7cf8] hover:underline"
          >
            + Add another inbox
          </Link>
        </div>

        {/* Danger zone */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Delete Account</h2>
          <p className="text-sm text-gray-500 mb-4">
            Permanently deletes your account and all {user.inboxes.length} connected{" "}
            {user.inboxes.length === 1 ? "inbox" : "inboxes"}. This cannot be undone.
          </p>
          <DeleteAccountButton />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#7c7cf8]" />
          <span className="text-sm font-semibold text-gray-700">DiscoveryMail</span>
        </div>
        <span className="text-xs text-gray-400">© {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
