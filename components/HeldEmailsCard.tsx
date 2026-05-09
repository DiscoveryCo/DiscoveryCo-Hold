"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

interface Props {
  heldCount: number
  isActive: boolean
}

export function HeldEmailsCard({ heldCount, isActive }: Props) {
  const [hidden, setHidden] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setHidden(localStorage.getItem("heldCountHidden") === "true")
  }, [])

  function toggle() {
    const next = !hidden
    setHidden(next)
    localStorage.setItem("heldCountHidden", String(next))
  }

  async function refresh() {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 600)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Held Emails</p>
        {isActive && (
          <button onClick={refresh} className="text-gray-400 hover:text-gray-600 transition-colors" title="Refresh count">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>
      {isActive ? (
        hidden ? (
          <p className="text-sm text-gray-400">Count hidden.</p>
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-gray-900 text-2xl">{heldCount}</strong>{" "}
            {heldCount === 1 ? "email is" : "emails are"} currently held back from your inbox.
          </p>
        )
      ) : (
        <p className="text-sm text-gray-400">
          DiscoveryMail is off. Start it to begin holding emails.
        </p>
      )}
      {isActive && (
        <button
          onClick={toggle}
          className="text-[#7c7cf8] text-sm mt-2 inline-block hover:underline"
        >
          {hidden ? "Show count" : "Hide count"}
        </button>
      )}
    </div>
  )
}
