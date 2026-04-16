import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const SEGMENT_ID = import.meta.env.RESEND_SEGMENT_ID;
const FROM_EMAIL =
  import.meta.env.RESEND_FROM_EMAIL ?? "Team Tally <onboarding@resend.dev>";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const honeypot = typeof body.website === "string" ? body.website : "";

    // Honeypot: bots auto-fill every field. Humans never touch this one.
    // Return 200 so bots don't learn they were flagged.
    if (honeypot) {
      return Response.json({ ok: true });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return Response.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const { error: contactError } = await resend.contacts.create({
      email,
      segments: [{ id: SEGMENT_ID }],
    });

    if (contactError) {
      const message = contactError.message?.toLowerCase() ?? "";
      // Resend returns a validation error when the contact is already
      // in the audience. Surface that as a distinct success case.
      if (message.includes("already exists") || message.includes("already in")) {
        return Response.json({ ok: true, alreadyJoined: true });
      }
      console.error("Resend contacts.create error:", contactError);
      return Response.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }

    // Welcome email. Awaited so Vercel doesn't kill the function mid-send,
    // but a failure here shouldn't fail the whole request — the user is
    // already on the list, which is what they asked for.
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: WELCOME_SUBJECT,
      html: WELCOME_HTML,
      text: WELCOME_TEXT,
    });

    if (emailError) {
      console.error("Welcome email failed:", emailError);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Waitlist signup failed:", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
};

// TODO (you): Review the copy below. It matches the landing page voice
// (punchy, sports-y, no-nonsense) but you might want to tweak it.
const WELCOME_SUBJECT = "You're on the Team Tally waitlist";

const WELCOME_TEXT = `You're on the list.

Thanks for signing up for Team Tally — the fine tracker your team will actually use.

We'll drop you one email the moment the app ships on iOS and Android. No spam, no newsletter, no "have you considered our other products" — just the launch.

In the meantime, start thinking about which teammate is going to top the leaderboard.

— Team Tally
`;

const WELCOME_HTML = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e5e5e5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:48px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#16161e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 32px;">
            <tr>
              <td>
                <p style="margin:0 0 24px;font-size:13px;font-weight:600;color:#f59e0b;text-transform:uppercase;letter-spacing:0.08em;">
                  Team Tally
                </p>
                <h1 style="margin:0 0 20px;font-size:28px;font-weight:800;line-height:1.15;letter-spacing:-0.02em;color:#ffffff;">
                  You're on the list.
                </h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#c7c7cf;">
                  Thanks for signing up for Team Tally — the fine tracker your team will actually use.
                </p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#c7c7cf;">
                  We'll drop you one email the moment the app ships on iOS and Android. No spam, no newsletter, no "have you considered our other products" — just the launch.
                </p>
                <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#c7c7cf;">
                  In the meantime, start thinking about which teammate is going to top the leaderboard.
                </p>
                <p style="margin:0;font-size:14px;color:#8a8a95;">
                  — Team Tally
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
