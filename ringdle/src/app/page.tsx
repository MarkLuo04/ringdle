import { api } from "~/trpc/server";
import { BoxerSearchResults } from "@/components/BoxerSearchResults";

export default async function Home() {
  const fighter = await api.boxing.getRandomFighter();

  return (
    <div className="flex flex-col gap-16 justify-center items-center mt-16">  
      {/* Header */}
      <header className="text-4xl font-bold">
        <h1>Ringdle</h1>
      </header>

      {/* search bar */}
      <BoxerSearchResults />
    </div>
  );
}
