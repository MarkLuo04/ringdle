import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "~/components/ui/card";
import { api } from "~/trpc/server";

export default async function Home() {
  const fighter = await api.boxing.getRandomFighter();

  return (
    <div className="flex flex-col gap-16 justify-center items-center mt-16">  
      {/* Header */}
      <header className="text-4xl font-bold">
        <h1>Ringdle</h1>
      </header>

      {/* search bar */}
      <span className="padding-0"><input type="text" placeholder="Search" className="padding-0" />
      <button className="padding-0">Test Button</button>
      </span>

      {/* Fighter data */}
      <section>
        <h2 className="text-xl font-bold mb-4">Fighter Data</h2>
        <Card className="flex flex-col justify-between gap-2 w-max p-4">
          <CardHeader className="flex-row items-center">
            <CardTitle>{fighter.name}</CardTitle>
          </CardHeader>
          <CardDescription className="ml-6">{fighter.alias}</CardDescription>
          <CardContent>
            <p>{fighter.nationality}</p>
            <p>{fighter.division.name}</p>
            <p>{fighter.stats.wins} Wins</p>
            <p>{fighter.stats.losses} Losses</p>
            <p>{fighter.height_ft}</p>
            {fighter.titles.map(t => (
              <p key={t.id}>{t.name}</p>
            ))}
          </CardContent>  
          <CardFooter className="flex justify-between">
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
