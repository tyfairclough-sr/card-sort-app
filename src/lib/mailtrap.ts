import { MailtrapClient } from "mailtrap";

function getMailtrapClient(): MailtrapClient {
  const token = process.env.MAILTRAP_API_TOKEN?.trim();
  const inboxRaw = process.env.MAILTRAP_TEST_INBOX_ID?.trim();
  if (!token) {
    throw new Error("MAILTRAP_API_TOKEN is not set");
  }
  if (!inboxRaw) {
    throw new Error("MAILTRAP_TEST_INBOX_ID is not set");
  }
  const testInboxId = Number(inboxRaw);
  if (!Number.isFinite(testInboxId)) {
    throw new Error("MAILTRAP_TEST_INBOX_ID must be a number");
  }
  return new MailtrapClient({
    token,
    sandbox: true,
    testInboxId,
  });
}

export async function sendPasswordResetEmail(params: {
  toEmail: string;
  resetUrl: string;
}): Promise<void> {
  const client = getMailtrapClient();
  const fromEmail =
    process.env.MAILTRAP_FROM_EMAIL?.trim() || "hello@example.com";
  const fromName = process.env.MAILTRAP_FROM_NAME?.trim() || "Research App";

  await client.send({
    from: { email: fromEmail, name: fromName },
    to: [{ email: params.toEmail }],
    subject: "Reset your password",
    text: [
      "We received a request to reset the password for your admin account.",
      "",
      `Open this link to choose a new password (valid for 1 hour):`,
      params.resetUrl,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    category: "Password reset",
  });
}
