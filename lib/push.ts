import webpush from "web-push"

const configured =
  !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY

if (configured) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? "admin@wesl.nl"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

export const pushEnabled = configured

export async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<{ success?: boolean; expired?: boolean; error?: string }> {
  if (!configured) return { error: "Push not configured" }
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode
    if (code === 410 || code === 404) return { expired: true } // subscription gone
    console.error("[push] error", err)
    return { error: "send failed" }
  }
}
