"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { signOut } from "next-auth/react"
import { Trash2, X } from "lucide-react"
import Link from "next/link"

interface Inbox {
  id: string
  email: string
  name: string | null
  image: string | null
  isActive: boolean
  isPrimary: boolean
  isPaidSeat: boolean
}

// ── Remove a single non-primary inbox ──────────────────────────────────────

export function RemoveInboxButton({ inbox }: { inbox: Inbox }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (inbox.isPaidSeat) {
    return (
      <Link href="/billing" className="text-xs text-[#4D4D4D] hover:text-[#A78BFA] transition-colors">
        Manage in billing
      </Link>
    )
  }

  async function handleRemove() {
    setLoading(true)
    try {
      const res = await fetch(`/api/inbox?inboxId=${inbox.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success(`${inbox.email} removed`)
      router.refresh()
    } catch {
      toast.error("Failed to remove inbox")
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#4D4D4D]">Remove this inbox?</span>
        <button
          onClick={handleRemove}
          disabled={loading}
          className="text-xs bg-[#F43F5E] hover:bg-[#d93652] text-white px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Removing…" : "Yes, remove"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[#4D4D4D] hover:text-[#4D4D4D]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-[#4D4D4D] hover:text-[#F43F5E] transition-colors"
    >
      Remove
    </button>
  )
}

// ── Delete entire account ───────────────────────────────────────────────────

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (input !== "DELETE") return
    setLoading(true)
    try {
      const res = await fetch("/api/account", { method: "DELETE" })
      if (!res.ok) throw new Error()
      await signOut({ callbackUrl: "/login" })
    } catch {
      toast.error("Failed to delete account")
      setLoading(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-2 bg-[#fff1f3] hover:bg-red-100 text-[#d93652] border border-[#fda4af] text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Permanently Delete Account
      </button>
    )
  }

  return (
    <div className="space-y-3 p-4 bg-[#fff1f3] border border-[#fda4af] rounded-xl">
      <p className="text-sm text-[#be1d37]">
        This will release all held emails, remove all your data, and cannot be undone.
        Type <strong>DELETE</strong> to confirm.
      </p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type DELETE to confirm"
        className="w-full border border-[#fda4af] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
      />
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={input !== "DELETE" || loading}
          className="bg-[#F43F5E] hover:bg-[#d93652] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
        >
          {loading ? "Deleting…" : "Delete my account"}
        </button>
        <button
          onClick={() => { setConfirming(false); setInput("") }}
          className="border border-[#E5E7EB] text-[#4D4D4D] text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
