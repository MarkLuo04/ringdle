import { api } from "~/trpc/server";
import { BoxerSearchResults } from "@/components/BoxerSearchResults";

export default async function Home() {
  return (
    <div className="flex flex-col gap-8 md:gap-16 justify-center items-center mt-8 md:mt-16 w-full px-4 sm:px-6">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-primary">Ringdle</h1>
        <p className="mt-2 text-base sm:text-lg text-muted-foreground tracking-widest uppercase">Guess the boxer</p>
      </header>

      {/* search bar and results table*/}
      <BoxerSearchResults />
    </div>
  );
}
