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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function UserRegister() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validateEmail(value: string): boolean {
    if (!value) {
      setEmailError("Email is required.");
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError(null);
    return true;
  }

  function validatePassword(value: string): boolean {
    if (!value) {
      setPasswordError("Password is required.");
      return false;
    }
    if (value.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
      return false;
    }
    setPasswordError(null);
    return true;
  }

  // Register a new user
  const register = api.auth.register.useMutation({
    onSuccess: async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Account created but sign-in failed. Please log in.");
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    },
    onError: (err) => {
      // Extract the first Zod field error when available, otherwise use the message
      const fieldErrors = err.data?.zodError?.fieldErrors;
      if (fieldErrors) {
        const first = Object.values(fieldErrors).flat()[0];
        if (first) {
          setError(first);
          return;
        }
      }
      setError(err.message);
    },
  });

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const emailOk = validateEmail(email);
    const passwordOk = validatePassword(password);
    if (!emailOk || !passwordOk) return;
    register.mutate({ name, email, password });
  }

  return (
    <Card className="w-full max-w-sm">
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
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={() => validateEmail(email)}
              required
              autoComplete="email"
            />
            {emailError && (
              <Text as="p" className="text-destructive text-sm">
                {emailError}
              </Text>
            )}
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1">
            <Text as="h6">Password</Text>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              onBlur={() => validatePassword(password)}
              required
              autoComplete="new-password"
            />
            {passwordError && (
              <Text as="p" className="text-destructive text-sm">
                {passwordError}
              </Text>
            )}
          </div>

          {/* General error message */}
          {error && (
            <Text as="p" className="text-destructive text-sm">
              {error}
            </Text>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={register.isPending}
          >
            {register.isPending ? "Creating account…" : "Create account"}
          </Button>

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
