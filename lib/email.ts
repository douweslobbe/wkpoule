import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_ADDRESS = "WK Pool 2026 <notifications@wesl.nl>"

// ─── Wachtwoord reset ─────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Wachtwoord resetten — WK Pool 2026",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111827;border:2px solid #1f2937;max-width:520px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#FF6200;padding:20px 28px;border-bottom:3px solid #000;">
            <p style="margin:0;color:#fff;font-size:13px;font-weight:bold;letter-spacing:2px;">⚽ WK POOL 2026</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 28px;">
            <p style="margin:0 0 8px;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Hallo ${name},</p>
            <h1 style="margin:0 0 20px;color:#fff;font-size:18px;font-weight:bold;">Wachtwoord resetten</h1>
            <p style="margin:0 0 24px;color:#d1d5db;font-size:13px;line-height:1.8;">
              We hebben een verzoek ontvangen om jouw wachtwoord te resetten. Klik op de knop hieronder om een nieuw wachtwoord in te stellen.
            </p>

            <!-- Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:#FF6200;border:2px solid #000;">
                  <a href="${resetUrl}" style="display:block;padding:14px 28px;color:#fff;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:1px;">
                    WACHTWOORD RESETTEN ▶
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#6b7280;font-size:11px;line-height:1.8;">
              Deze link is <strong style="color:#9ca3af;">1 uur</strong> geldig. Als je geen resetverzoek hebt ingediend, kun je deze mail negeren.
            </p>
            <p style="margin:16px 0 0;color:#4b5563;font-size:10px;word-break:break-all;">
              Of kopieer: ${resetUrl}
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px;border-top:2px solid #1f2937;">
            <p style="margin:0;color:#374151;font-size:10px;">
              WK Pool 2026 · <a href="https://wkpool2026.wesl.nl" style="color:#374151;">wkpool2026.wesl.nl</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })
}

// ─── Deadline reminder ────────────────────────────────────────────────────────

export async function sendDeadlineReminderEmail(
  to: string,
  name: string,
  poolName: string,
  deadlineLabel: string,
  poolUrl: string,
) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `⏰ Deadline herinnering: ${poolName} — WK Pool 2026`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111827;border:2px solid #1f2937;max-width:520px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#FF6200;padding:20px 28px;border-bottom:3px solid #000;">
            <p style="margin:0;color:#fff;font-size:13px;font-weight:bold;letter-spacing:2px;">⚽ WK POOL 2026</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 28px;">
            <p style="margin:0 0 8px;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Hallo ${name},</p>
            <h1 style="margin:0 0 20px;color:#FFD700;font-size:18px;font-weight:bold;">⏰ Deadline nadert!</h1>
            <p style="margin:0 0 24px;color:#d1d5db;font-size:13px;line-height:1.8;">
              De deadline voor <strong style="color:#fff;">${poolName}</strong> nadert: <strong style="color:#FF6200;">${deadlineLabel}</strong>.
              Vergeet niet je voorspellingen in te vullen!
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:#16a34a;border:2px solid #000;">
                  <a href="${poolUrl}" style="display:block;padding:14px 28px;color:#fff;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:1px;">
                    VOORSPELLINGEN INVULLEN ▶
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px;border-top:2px solid #1f2937;">
            <p style="margin:0;color:#374151;font-size:10px;">
              WK Pool 2026 · <a href="https://wkpool2026.wesl.nl" style="color:#374151;">wkpool2026.wesl.nl</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })
}
