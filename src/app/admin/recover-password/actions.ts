"use server";

import { hashPasswordResetToken } from "@/lib/password-reset-token";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetSchema = z
  .object({
    token: z.string().min(1, "Reset link is invalid or expired."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RecoverPasswordState = {
  error?: string;
  success?: boolean;
};

export async function resetPasswordWithToken(
  _prev: RecoverPasswordState,
  formData: FormData,
): Promise<RecoverPasswordState> {
  const parsed = resetSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "Invalid input." };
  }

  const { token, newPassword } = parsed.data;
  const tokenHash = hashPasswordResetToken(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { success: true };
}
