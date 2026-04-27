"use client"

import { useState, useEffect } from "react"

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function PushSubscribeButton({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Register service worker + check subscription status
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setLoading(false)
      return
    }
    setSupported(true)
    setPermission(Notification.permission)

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSubscribed(!!sub)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function toggle() {
    setError(null)
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch("/api/push", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setSubscribed(false)
        setPermission(Notification.permission)
      } else {
        const perm = await Notification.requestPermission()
        setPermission(perm)
        if (perm !== "granted") {
          setError("Notificaties geblokkeerd. Pas dit aan via je browser-instellingen.")
          setLoading(false)
          return
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })

        const json = sub.toJSON()
        const res = await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        })
        if (!res.ok) throw new Error("Server error")
        setSubscribed(true)
      }
    } catch (e) {
      setError("Er ging iets mis. Probeer het opnieuw.")
      console.error(e)
    }
    setLoading(false)
  }

  if (!supported) {
    return (
      <p className="font-pixel" style={{ fontSize: "7px", color: "var(--c-text-4)" }}>
        Push notificaties worden niet ondersteund door jouw browser.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={toggle}
        disabled={loading || permission === "denied"}
        className="font-pixel px-4 py-2"
        style={{
          fontSize: "7px",
          background: subscribed ? "#0a3d1f" : "transparent",
          color: subscribed ? "#4af56a" : permission === "denied" ? "var(--c-text-5)" : "var(--c-text-3)",
          border: `2px solid ${subscribed ? "#1a6b3a" : permission === "denied" ? "var(--c-border)" : "var(--c-border-mid)"}`,
          cursor: loading || permission === "denied" ? "default" : "pointer",
          opacity: loading ? 0.5 : 1,
          transition: "all 0.15s",
        }}
      >
        {loading
          ? "..."
          : subscribed
          ? "🔔 NOTIFICATIES AAN"
          : permission === "denied"
          ? "🚫 NOTIFICATIES GEBLOKKEERD"
          : "🔕 NOTIFICATIES UIT"}
      </button>

      {subscribed && (
        <p className="font-pixel" style={{ fontSize: "6px", color: "var(--c-text-4)", lineHeight: "1.8" }}>
          Je krijgt een herinnering als een wedstrijd bijna begint en je nog niet hebt voorspeld.
        </p>
      )}
      {permission === "denied" && (
        <p className="font-pixel" style={{ fontSize: "6px", color: "#ff8800", lineHeight: "1.8" }}>
          Notificaties zijn geblokkeerd in je browser. Pas dit aan via de site-instellingen.
        </p>
      )}
      {error && (
        <p className="font-pixel" style={{ fontSize: "6px", color: "#ff4444" }}>⚠ {error}</p>
      )}
    </div>
  )
}
