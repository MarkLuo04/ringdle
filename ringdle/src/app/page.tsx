import Link from "next/link";
import { auth, signOut } from "~/server/auth";
import { BoxerSearchResults } from "@/components/BoxerSearchResults";
import { Button } from "@/components/retroui/Button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="mt-8 flex w-full flex-col items-center justify-center gap-8 px-4 sm:px-6 md:mt-16 md:gap-16">
      {/* Header */}
      <header className="relative w-full text-center">
        {/* Sign in / sign out button */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2">
          {session ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>

        <h1 className="text-primary text-5xl font-extrabold tracking-tight sm:text-7xl">
          Ringdle
        </h1>
        <p className="text-muted-foreground mt-2 text-base tracking-widest uppercase sm:text-lg">
          Guess the boxer
        </p>
      </header>

      {/* search bar and results table*/}
      <BoxerSearchResults />
    </div>
  );
}
