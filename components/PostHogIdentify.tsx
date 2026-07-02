"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

export function PostHogIdentify({ email, subscriptionStatus }: { email: string; subscriptionStatus?: string | null }) {
  useEffect(() => {
    posthog.identify(email, { email, subscription_status: subscriptionStatus ?? null })
  }, [email, subscriptionStatus])
  return null
}
