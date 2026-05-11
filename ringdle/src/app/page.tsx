import { api } from "~/trpc/server";
import { BoxerSearchResults } from "@/components/BoxerSearchResults";

export default async function Home() {
  const fighter = await api.boxing.getRandomFighter();

  return (
    <div className="flex flex-col gap-16 justify-center items-center mt-16">  
      {/* Header */}
      <header className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-primary">Ringdle</h1>
        <p className="mt-2 text-sm text-muted-foreground tracking-widest uppercase">Guess the boxer</p>
      </header>

      {/* search bar and results table*/}
      <BoxerSearchResults />
    </div>
  );
}
