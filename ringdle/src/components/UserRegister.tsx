"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { Text } from "@/components/retroui/Text";
import { Input } from "@/components/retroui/Input";
import { api } from "~/trpc/react";

export function UserRegister() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Register a new user
  const register = api.auth.register.useMutation({
    onSuccess: async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // Error handling
      if (result?.error) {
        setError("Account created but sign-in failed. Please log in.");
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    register.mutate({ name, email, password });
  }

  return (
    <Card className="w-full max-w-sm">
      {/* Register form */}
      <Card.Header className="pb-1">
        <Card.Title>Create an account</Card.Title>
      </Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Text as="h6">Name</Text>
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          {/* Email input */}
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
              autoComplete="new-password"
            />
          </div>

          {/* Error message */}
          {error && (
            <Text as="p" className="text-sm text-destructive">
              {error}
            </Text>
          )}

          {/* Create account button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={register.isPending}
          >
            {register.isPending ? "Creating account…" : "Create account"}
          </Button>

          {/* Already have an account? link */}
          <Text as="p" className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </Text>
        </form>
      </Card.Content>
    </Card>
  );
}
