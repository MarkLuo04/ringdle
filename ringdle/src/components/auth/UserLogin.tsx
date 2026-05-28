"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { Text } from "@/components/retroui/Text";
import { Input } from "@/components/retroui/Input";
import { AuthPageClose } from "./AuthPageClose";

export function UserLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    // sign in with credentials
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    // Error handling
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    // Login form
    <Card className="w-full max-w-sm">
      <Card.Header className="flex-row items-center justify-between pb-1">
        <Card.Title className="mb-0">Sign in to Ringdle</Card.Title>
        <AuthPageClose />
      </Card.Header>
      <Card.Content>
        {/* Email input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Text as="h6">Email</Text>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1">
            <Text as="h6">Password</Text>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Error message */}
          {error && (
            <Text as="p" className="text-destructive text-sm">
              {error}
            </Text>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </div>

          <Text as="p" className="text-center text-sm">
            Don&apos;t have an account?
            <br />
            <Link href="/register" className="underline">
              Create one
            </Link>
          </Text>
        </form>
      </Card.Content>
    </Card>
  );
}
