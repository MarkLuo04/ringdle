import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "~/components/ui/card";
import { api } from "~/trpc/server";

export default async function Home() {
  const fighter = await api.boxing.getFighterById({ id: "6715fc1faf69bb50508b7a83" });

  return (
    <div>
      {/* Header */}
      <header>
        <h1>Ringdle</h1>
      </header>

      {/* search bar */}
      <input type="text" placeholder="Search" />
      <button>Test</button>

      {/* Fighter data */}
      <section>
        <h2>Fighter Data</h2>
        <Card>
          <CardHeader>
            <CardTitle>{fighter.name}</CardTitle>
          </CardHeader>
          <CardDescription>{fighter.alias}</CardDescription>
          <CardContent>
            <p>{fighter.nationality}</p>
            <p>{fighter.division.name}</p>
            <p>{fighter.stats.wins} Wins</p>
            <p>{fighter.stats.losses} Losses</p>
          </CardContent>  
          <CardFooter>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
