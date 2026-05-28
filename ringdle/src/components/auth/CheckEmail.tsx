"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { Text } from "@/components/retroui/Text";
import { api } from "~/trpc/react";

const COOLDOWN_SECONDS = 60;

export function CheckEmail({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start cooldown timer
  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }
  // Clear cooldown timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  // Resend verification email
  const resend = api.auth.resendVerification.useMutation({
    onSuccess: () => {
      setSent(true);
      setError(null);
      startCooldown();
    },
    onError: (err) => {
      setError(err.message);
      setSent(false);
    },
  });

  function handleResend() {
    if (!email || cooldown > 0) return;
    setSent(false);
    setError(null);
    resend.mutate({ email });
  }

  const resendDisabled = resend.isPending || cooldown > 0;

  return (
    <Card className="w-full max-w-sm">
      <Card.Header>
        <Card.Title>Check your inbox</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-5">
        {/* Verification email sent */}
        <div className="flex flex-col gap-2">
          <Text as="p" className="text-sm">
            We sent a verification link to{" "}
            {email ? (
              <span className="font-medium">{email}</span>
            ) : (
              "your email address"
            )}
            . Click the link to activate your account.
          </Text>
          <Text as="p" className="text-muted-foreground text-sm">
            The link expires in 24 hours. If you don&apos;t see it, check your
            spam folder.
          </Text>
        </div>

        {/* Verification email resent */}
        {sent && (
          <Text as="p" className="text-sm text-green-600">
            Verification email resent, please check your inbox.
          </Text>
        )}

        {/* Error message */}
        {error && (
          <Text as="p" className="text-destructive text-sm">
            {error}
          </Text>
        )}

        {/* Back to sign in button */}
        <div className="flex flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
          {email && (
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={handleResend}
              disabled={resendDisabled}
            >
              {resend.isPending
                ? "Sending…"
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend verification email"}
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
