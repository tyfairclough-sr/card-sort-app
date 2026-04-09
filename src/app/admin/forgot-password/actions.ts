"use server";

import { randomBytes } from "node:crypto";

import { getAppOrigin } from "@/lib/app-origin";
import { sendPasswordResetEmail } from "@/lib/mailtrap";
import { hashPasswordResetToken } from "@/lib/password-reset-token";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordState = {
  error?: string;
  success?: boolean;
};

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = emailSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      }),
    ]);

    const resetUrl = `${getAppOrigin()}/admin/recover-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendPasswordResetEmail({ toEmail: email, resetUrl });
    } catch (err) {
      console.error("[password-reset] Mailtrap send failed:", err);
    }
  }

  return { success: true };
}
