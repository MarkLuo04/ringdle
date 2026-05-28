import { VerifyEmail } from "@/components/auth/VerifyEmail";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <VerifyEmail token={token ?? ""} />
    </div>
  );
}
