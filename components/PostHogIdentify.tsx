"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

export function PostHogIdentify({
  email,
  subscriptionStatus,
  trialEndsAt,
}: {
  email: string
  subscriptionStatus?: string | null
  trialEndsAt?: Date | string | null
}) {
  useEffect(() => {
    posthog.identify(email, {
      email,
      subscription_status: subscriptionStatus ?? null,
      trial_ends_at: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
    })
  }, [email, subscriptionStatus, trialEndsAt])
  return null
}
