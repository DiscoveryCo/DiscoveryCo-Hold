"use client"

import { useState } from "react"
import { Check, Star, CreditCard, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"

const FEATURES_MONTHLY = [
  "Hold your inbox",
  "Multiple inbox support",
  "Activity logs",
  "Custom delivery scheduling",
  "VIP lists",
  "Custom Do-Not-Disturb periods",
]

const FEATURES_ANNUAL_EXTRA = [
  "20% savings vs monthly",
  "One invoice per year",
]

interface SubDetails {
  planName: string
  interval: "month" | "year"
  amount: number
  periodEnd: string
  cancelAtPeriodEnd: boolean
  cardBrand: string | null
  cardLast4: string | null
}

interface InboxItem {
  id: string
  email: string
  name: string | null
  image: string | null
  isPrimary: boolean
  trialEndsAt: string | null
  scheduledRemovalAt: string | null
}

interface Props {
  hasActiveSubscription: boolean
  stripeCustomerId: string | null
  monthlyPriceId: string
  annualPriceId: string
  subDetails: SubDetails | null
  inboxes: InboxItem[]
}

export function BillingClient({
  hasActiveSubscription,
  stripeCustomerId,
  monthlyPriceId,
  annualPriceId,
  subDetails,
  inboxes,
}: Props) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [loading, setLoading] = useState<null | "checkout" | "updateCard" | "invoices" | "cancel" | "resume" | string>(null)
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  async function handleChoosePlan() {
    setLoading("checkout")
    try {
      const priceId = billing === "monthly" ? monthlyPriceId : annualPriceId
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, quantity: inboxes.length }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed")
      setLoading(null)
      window.location.href = data.url
    } catch {
      toast.error("Could not start checkout. Please try again.")
      setLoading(null)
    }
  }

  async function handleAddInbox(inboxId: string) {
    setLoading(`add-${inboxId}`)
    try {
      const res = await fetch("/api/billing/add-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inboxId }),
      })
      if (!res.ok) throw new Error()
      toast.success("Inbox added to subscription")
      router.refresh()
    } catch {
      toast.error("Failed to add inbox")
    } finally {
      setLoading(null)
    }
  }

  async function handleRemoveInbox(inboxId: string) {
    setLoading(`remove-${inboxId}`)
    try {
      const res = await fetch("/api/billing/remove-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inboxId }),
      })
      if (!res.ok) throw new Error()
      toast.success("Inbox will be removed at end of billing period")
      router.refresh()
    } catch {
      toast.error("Failed to remove inbox")
    } finally {
      setLoading(null)
    }
  }

  async function handleUpdateCard() {
    setLoading("updateCard")
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow: "payment_method_update" }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed")
      setLoading(null)
      window.location.href = data.url
    } catch {
      toast.error("Could not open card update. Please try again.")
      setLoading(null)
    }
  }

  async function handleViewInvoices() {
    setLoading("invoices")
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed")
      setLoading(null)
      window.location.href = data.url
    } catch {
      toast.error("Could not open billing portal. Please try again.")
      setLoading(null)
    }
  }

  async function handleCancel() {
    setLoading("cancel")
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" })
      if (!res.ok) throw new Error()
      toast.success("Subscription will cancel at the end of the billing period.")
      setConfirming(false)
      router.refresh()
    } catch {
      toast.error("Could not cancel subscription. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  async function handleResume() {
    setLoading("resume")
    try {
      const res = await fetch("/api/billing/resume", { method: "POST" })
      if (!res.ok) throw new Error()
      toast.success("Subscription resumed.")
      router.refresh()
    } catch {
      toast.error("Could not resume subscription. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  // ── Active subscription view ──────────────────────────────────────────────
  if (hasActiveSubscription) {
    const price = subDetails ? (subDetails.amount / 100).toFixed(2) : null
    const intervalLabel = subDetails?.interval === "year" ? "year" : "month"

    return (
      <div className="space-y-4">
        {/* Plan card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h2 className="font-semibold text-[#161616] mb-4">Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              {price ? (
                <p className="text-[#161616] font-medium">
                  <span className="font-bold">${price}/{intervalLabel}</span>
                  <span className="text-[#4D4D4D] font-normal ml-2">
                    {subDetails!.cancelAtPeriodEnd
                      ? `Access until ${subDetails!.periodEnd}`
                      : `Renews ${subDetails!.periodEnd}`}
                  </span>
                </p>
              ) : (
                <p className="text-[#161616] font-medium">DiscoveryMail — Active</p>
              )}
              {subDetails?.cancelAtPeriodEnd && (
                <p className="text-xs text-amber-600 mt-1">
                  Your subscription is set to cancel at the end of this period.
                </p>
              )}
            </div>
            {subDetails?.cancelAtPeriodEnd ? (
              <button
                onClick={handleResume}
                disabled={loading === "resume"}
                className="text-sm bg-[#ededff] hover:bg-[#dcdcff] text-[#A78BFA] font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading === "resume" ? "Loading…" : "Resume membership"}
              </button>
            ) : !subDetails ? null : confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#4D4D4D]">Cancel at period end?</span>
                <button
                  onClick={handleCancel}
                  disabled={loading === "cancel"}
                  className="text-xs bg-[#F43F5E] hover:bg-[#d93652] text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading === "cancel" ? "Canceling…" : "Yes, cancel"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-xs text-[#4D4D4D] hover:text-[#4D4D4D] transition-colors"
                >
                  Keep
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="text-sm text-[#4D4D4D] hover:text-[#F43F5E] transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h2 className="font-semibold text-[#161616] mb-4">Payment Method</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#4D4D4D] text-sm">
              <CreditCard className="w-4 h-4" />
              {subDetails?.cardBrand && subDetails?.cardLast4 ? (
                <span className="capitalize">{subDetails.cardBrand} •••• {subDetails.cardLast4}</span>
              ) : (
                <span>Managed securely via Stripe</span>
              )}
            </div>
            <button
              onClick={handleUpdateCard}
              disabled={loading === "updateCard"}
              className="text-sm bg-[#ededff] hover:bg-[#dcdcff] text-[#A78BFA] font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {loading === "updateCard" ? "Loading…" : "Update card"}
            </button>
          </div>
        </div>

        {/* Inboxes */}
        {inboxes.length > 1 && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <h2 className="font-semibold text-[#161616] mb-4">Inboxes</h2>
            <div className="space-y-3">
              {inboxes.map((inbox) => {
                const now = new Date()
                const trial = inbox.trialEndsAt ? new Date(inbox.trialEndsAt) : null
                const removal = inbox.scheduledRemovalAt ? new Date(inbox.scheduledRemovalAt) : null
                const daysLeft = trial ? Math.max(0, differenceInDays(trial, now)) : null
                const isOnTrial = trial && trial > now
                const isScheduled = !!removal

                return (
                  <div key={inbox.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#161616] truncate">{inbox.name ?? inbox.email}</p>
                      <p className="text-xs text-[#4D4D4D] truncate">{inbox.email}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {inbox.isPrimary ? (
                        <span className="text-xs text-[#4D4D4D]">Primary · Included</span>
                      ) : isScheduled ? (
                        <span className="text-xs text-amber-600">Removes {format(removal!, "MMM d")}</span>
                      ) : isOnTrial ? (
                        <>
                          <span className="text-xs text-[#4D4D4D]">Trial · {daysLeft}d left</span>
                          <button
                            onClick={() => handleAddInbox(inbox.id)}
                            disabled={loading !== null}
                            className="text-xs bg-[#ededff] hover:bg-[#dcdcff] text-[#A78BFA] font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {loading === `add-${inbox.id}` ? "Adding…" : "Add — $3.49/mo"}
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-green-600">Active</span>
                          <button
                            onClick={() => handleRemoveInbox(inbox.id)}
                            disabled={loading !== null}
                            className="text-xs text-[#4D4D4D] hover:text-[#F43F5E] transition-colors disabled:opacity-50"
                          >
                            {loading === `remove-${inbox.id}` ? "Removing…" : "Remove"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Invoice history */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h2 className="font-semibold text-[#161616] mb-4">Invoice History</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#4D4D4D]">View and download past invoices.</p>
            <button
              onClick={handleViewInvoices}
              disabled={loading === "invoices"}
              className="text-sm bg-[#ededff] hover:bg-[#dcdcff] text-[#A78BFA] font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === "invoices" ? "Loading…" : "View invoices"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── No subscription — show pricing ───────────────────────────────────────
  const inboxCount = inboxes.length
  const additionalInboxes = Math.max(0, inboxCount - 1)
  const monthlyTotal = (4.99 + additionalInboxes * 3.49).toFixed(2)
  const annualTotal = (47.99 + additionalInboxes * 33.59).toFixed(2)
  const displayPrice = billing === "monthly" ? monthlyTotal : (parseFloat(annualTotal) / 12).toFixed(2)
  const allFeatures = billing === "annual"
    ? [...FEATURES_MONTHLY, ...FEATURES_ANNUAL_EXTRA]
    : FEATURES_MONTHLY

  return (
    <div className="max-w-sm mx-auto">
      <p className="text-xs text-[#4D4D4D] text-center mb-4 italic">All prices are in USD.</p>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#161616] text-center mb-4">DiscoveryMail</h3>

        {/* Price */}
        <div className="text-center mb-4">
          <div className="flex items-start justify-center gap-1">
            <span className="text-sm text-[#4D4D4D] mt-2">$</span>
            <span className="text-6xl font-bold text-[#A78BFA] leading-none">{displayPrice}</span>
            <span className="text-sm text-[#A78BFA] mt-auto mb-1">per month</span>
          </div>
          {billing === "annual" && (
            <p className="text-xs text-[#4D4D4D] mt-1">billed as ${annualTotal}/year</p>
          )}
          {inboxCount > 1 && (
            <p className="text-xs text-[#4D4D4D] mt-1">
              {billing === "monthly"
                ? `$4.99 base + $3.49 × ${additionalInboxes} additional inbox${additionalInboxes > 1 ? "es" : ""}`
                : `$47.99 base + $33.59 × ${additionalInboxes} additional inbox${additionalInboxes > 1 ? "es" : ""}`}
            </p>
          )}
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <button
            onClick={() => setBilling("annual")}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
              billing === "annual"
                ? "bg-[#A78BFA] text-white"
                : "text-[#A78BFA] hover:bg-[#ededff]"
            }`}
          >
            Yearly
          </button>
          <button
            onClick={() => setBilling("monthly")}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
              billing === "monthly"
                ? "bg-[#A78BFA] text-white"
                : "text-[#A78BFA] hover:bg-[#ededff]"
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Feature list */}
        <ul className="space-y-2.5 mb-6">
          {allFeatures.map((feature, i) => {
            const isBonus = billing === "annual" && i >= FEATURES_MONTHLY.length
            return (
              <li key={feature} className="flex items-center gap-2.5">
                {isBonus ? (
                  <Star className="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[#ededff] flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-[#A78BFA]" strokeWidth={3} />
                  </div>
                )}
                <span className="text-sm text-[#4D4D4D]">{feature}</span>
              </li>
            )
          })}
        </ul>

        <button
          onClick={handleChoosePlan}
          disabled={loading !== null}
          className="w-full bg-[#A78BFA] hover:bg-[#6b6be0] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading === "checkout" ? "Loading…" : "Choose Plan"}
        </button>
      </div>
    </div>
  )
}
