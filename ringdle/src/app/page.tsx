import Link from "next/link";
import { auth, signOut } from "~/server/auth";
import { BoxerSearchResults } from "@/components/BoxerSearchResults";
import { Button } from "@/components/retroui/Button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="mt-8 flex w-full flex-col items-center justify-center gap-8 px-4 sm:px-6 md:mt-16 md:gap-16">
      {/* Header */}
      <header className="relative w-full">
        <div className="mb-2 flex justify-end sm:absolute sm:top-0 sm:right-0 sm:mb-0">
          {session ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="text-muted-foreground hover:text-foreground sm:text-foreground"
              >
                Sign out
              </Button>
            </form>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground py-1 text-sm font-medium underline-offset-4 hover:underline sm:hidden"
              >
                Sign in
              </Link>
              <Button
                variant="outline"
                size="md"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>

        <div className="text-center">
          <h1 className="text-primary text-5xl font-extrabold tracking-tight sm:text-7xl">
            Ringdle
          </h1>
          <p className="text-muted-foreground mt-2 text-base tracking-widest uppercase sm:text-lg">
            Guess the boxer
          </p>
        </div>
      </header>

      {/* search bar and results table*/}
      <BoxerSearchResults />
    </div>
  );
}
