"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { Text } from "@/components/retroui/Text";
import { api } from "~/trpc/react";

export function VerifyEmail({ token }: { token: string }) {
  const verify = api.auth.verifyEmail.useMutation();

  useEffect(() => {
    if (token) {
      verify.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // If no token, show invalid link card
  if (!token) {
    return (
      <Card className="w-full max-w-sm text-center">
        <Card.Header className="pb-1">
          <Card.Title>Invalid link</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <Text as="p" className="text-sm">
            This verification link is missing a token. Please check the link in
            your email and try again.
          </Text>
          <Button asChild size="lg" className="w-full">
            <Link href="/register">Back to register</Link>
          </Button>
        </Card.Content>
      </Card>
    );
  }

  // If verification is pending, show verifying card
  if (verify.isPending) {
    return (
      <Card className="w-full max-w-sm text-center">
        <Card.Header className="pb-1">
          <Card.Title>Verifying…</Card.Title>
        </Card.Header>
        <Card.Content>
          <Text as="p" className="text-sm">
            Please wait while we verify your email address.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  // If verification is successful, show verified card
  if (verify.isSuccess) {
    return (
      <Card className="w-full max-w-sm text-center">
        <Card.Header className="pb-1">
          <Card.Title>Email verified!</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <Text as="p" className="text-sm">
            Your email has been verified. You can now sign in to your account.
          </Text>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Sign in</Link>
          </Button>
        </Card.Content>
      </Card>
    );
  }

  // If verification fails, show failed card
  return (
    <Card className="w-full max-w-sm text-center">
      <Card.Header className="pb-1">
        <Card.Title>Verification failed</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <Text as="p" className="text-destructive text-sm">
          {verify.error?.message ?? "Something went wrong."}
        </Text>
        <Button asChild size="lg" className="w-full">
          <Link href="/register">Back to register</Link>
        </Button>
      </Card.Content>
    </Card>
  );
}
