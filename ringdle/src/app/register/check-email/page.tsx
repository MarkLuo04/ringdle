import { CheckEmail } from "@/components/auth/CheckEmail";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <CheckEmail email={email ?? ""} />
    </div>
  );
}
