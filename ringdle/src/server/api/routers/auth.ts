import { randomBytes } from "crypto";
import { promises as dns } from "dns";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Resend } from "resend";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { hashPassword } from "~/server/auth/utils";
import { env } from "~/env";

const resend = new Resend(env.RESEND_API_KEY);

const TOKEN_EXPIRY_HOURS = 24;

// Returns false when the domain has no MX records (cannot receive email)
async function checkMxRecord(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

async function sendVerificationEmail(
  name: string,
  email: string,
  token: string,
) {
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  const { error } = await resend.emails.send({
    from: env.RESEND_SENDER_EMAIL,
    to: email,
    subject: "Verify your Ringdle email",
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for signing up for Ringdle! Please verify your email address by clicking the link below.</p>
      <p><a href="${verifyUrl}">Verify my email</a></p>
      <p>This link expires in ${TOKEN_EXPIRY_HOURS} hours.</p>
      <p>If you didn't create an account, you can ignore this email.</p>
    `,
  });

  if (error) {
    console.error("[Resend] Failed to send verification email:", error);
  }

  return error;
}

export const authRouter = createTRPCRouter({
  // Register a new user
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Reject addresses whose domain has no mail servers
      const mxValid = await checkMxRecord(input.email);
      if (!mxValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "That email domain does not exist. Please use a real email address.",
        });
      }

      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true, emailVerified: true },
      });

      if (existing) {
        if (!existing.emailVerified) {
          // [EMAIL VERIFICATION] - reenable when email verification is enabled
          // below with the original token-generation + sendVerificationEmail block:
          // await ctx.db.verificationToken.deleteMany({ where: { identifier: input.email } });
          // const token = randomBytes(32).toString("hex");
          // const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
          // await ctx.db.verificationToken.create({ data: { identifier: input.email, token, expires } });
          // const emailError = await sendVerificationEmail(existing.name ?? input.name, input.email, token);
          // if (emailError) {
          //   throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not send the verification email. Please try again.", cause: emailError });
          // }
          // return { email: input.email };

          // Account exists but was never verified
          await ctx.db.user.update({
            where: { id: existing.id },
            data: { emailVerified: new Date() },
          });
          return { email: input.email };
        }

        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with that email already exists.",
        });
      }

      const hashedPassword = await hashPassword(input.password);

      // [EMAIL VERIFICATION] - reenable when email verification is enabled
      // below and restore the token-generation + sendVerificationEmail block:
      // const token = randomBytes(32).toString("hex");
      // const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
      // await ctx.db.verificationToken.create({ data: { identifier: input.email, token, expires } });
      // const emailError = await sendVerificationEmail(input.name, input.email, token);
      // if (emailError) {
      //   // Roll back so the user can try again cleanly
      //   await ctx.db.verificationToken.deleteMany({ where: { identifier: input.email } });
      //   await ctx.db.user.delete({ where: { id: user.id } });
      //   throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not send the verification email. Please try again.", cause: emailError });
      // }
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          emailVerified: new Date(), // remove this line when re-enabling verification
        },
        select: { id: true, name: true, email: true },
      });

      return { email: user.email };
    }),

  // Resend a verification email to an existing unverified account
  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true, name: true, emailVerified: true },
      });

      // Return success even if user not found to avoid leaking account existence
      if (!user) return { success: true };

      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This email is already verified. You can sign in.",
        });
      }

      const RESEND_COOLDOWN_SECONDS = 60;
      const existingToken = await ctx.db.verificationToken.findFirst({
        where: { identifier: input.email },
      });
      if (existingToken) {
        const createdAt = new Date(
          existingToken.expires.getTime() - TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
        );
        const secondsSinceCreated = (Date.now() - createdAt.getTime()) / 1000;
        if (secondsSinceCreated < RESEND_COOLDOWN_SECONDS) {
          const remaining = Math.ceil(
            RESEND_COOLDOWN_SECONDS - secondsSinceCreated,
          );
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Please wait ${remaining} second${remaining === 1 ? "" : "s"} before resending.`,
          });
        }
      }

      await ctx.db.verificationToken.deleteMany({
        where: { identifier: input.email },
      });

      const token = randomBytes(32).toString("hex");
      const expires = new Date(
        Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
      );

      await ctx.db.verificationToken.create({
        data: { identifier: input.email, token, expires },
      });

      const emailError = await sendVerificationEmail(
        user.name ?? "there",
        input.email,
        token,
      );

      if (emailError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not send the verification email. Please try again.",
          cause: emailError,
        });
      }

      return { success: true };
    }),

  // Verify a user's email using the token from the verification email
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.verificationToken.findUnique({
        where: { token: input.token },
      });

      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired verification link.",
        });
      }

      if (record.expires < new Date()) {
        await ctx.db.verificationToken.delete({
          where: { token: input.token },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This verification link has expired. Please request a new one.",
        });
      }

      await ctx.db.user.update({
        where: { email: record.identifier },
        data: { emailVerified: new Date() },
      });

      await ctx.db.verificationToken.delete({ where: { token: input.token } });

      return { success: true };
    }),
});
