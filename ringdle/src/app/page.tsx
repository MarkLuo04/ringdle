import Link from "next/link";
import { auth, signOut } from "~/server/auth";
import { BoxerSearchResults } from "@/components/BoxerSearchResults";
import { Button } from "@/components/retroui/Button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-8 md:gap-16 justify-center items-center mt-8 md:mt-16 w-full px-4 sm:px-6">
      {/* Header */}
      <header className="relative w-full text-center">
        {/* Sign in / sign out button */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
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

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-primary">Ringdle</h1>
        <p className="mt-2 text-base sm:text-lg text-muted-foreground tracking-widest uppercase">Guess the boxer</p>
      </header>

      {/* search bar and results table*/}
      <BoxerSearchResults />
    </div>
  );
}
