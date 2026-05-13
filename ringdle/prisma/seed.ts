import { PrismaClient } from "../generated/prisma";
import type { BoxingDataListResponse } from "../src/server/api/routers/types/boxing-data.types";

const db = new PrismaClient();

const API_HOST = process.env.BOXING_DATA_API_HOST;
const API_KEY = process.env.BOXING_DATA_API_KEY;


const FIGHTER_NAMES = [
  "Naoya Inoue",
  "Oleksandr Usyk",
  "Shakur Stevenson",
  "Jesse Rodriguez",
  "Dmitry Bivol",
  "David Benavidez",
  "Devin Haney",
  "Artur Beterbiev",
  "Canelo Alvarez",
  "Emanuel Navarrete",
  "Sebastian Fundora",
  "Jaron Ennis",
  "Junto Nakatani",
  "Manny Pacquiao",
  "Vergil Ortiz Jr",
  "Oscar Collazo",
  "Jai Opetaia",
  "Rafael Espinoza",
  "Xander Zayas",
  "Seiya Tsutsumi",
  "Ricardo Sandoval",
  "O'Shaquie Foster",
  "Kenshiro Teraji",
  "Erislandy Lara",
  "Keyshawn Davis",
  "Angelo Leo",
  "Richardson Hitchins",
  "Brandon Figueroa",
  "Teofimo Lopez",
  "Bruce Carrington",
  "Marlon Tapales",
  "Isaac Cruz",
  "Anthony Cacace",
  "Takuma Inoue",
  "Lamont Roach",
  "Gary Antuanne Russell",
  "Carlos Adames",
  "Christian Mbilli",
  "Melvin Jerusalem",
  "Raymond Muratalla",
  "Rolly Romero",
  "Josh Kelly",
  "Fabio Wardley",
  "Eduardo Nunez",
  "Abdullah Mason",
  "Ryan Garcia",
  "Rene Santiago",
  "Tyson Fury",
  "Dalton Smith",
  "Masamichi Yabuki",
  "Errol Spence Jr",
  "Terence Crawford",
  "Manuel Ortiz",
  "Erik Morales",
  "Marco Antonio Barrera",
  "Lennox Lewis",
  "Gervonta Davis",
  "Charley Burley",
  "Aaron Pryor",
  "Carmen Basilio",
  "Dick Tiger",
  "Vasiliy Lomachenko",
  "Salvador Sanchez",
  "Ike Williams",
  "Pascual Perez",
  "Mike Tyson",
  "Alexis Arguello",
  "Oscar De La Hoya",
  "Roy Jones Jr",
  "Larry Holmes",
  "Tommy Hearns",
  "Jose Napoles",
  "Bernard Hopkins",
  "Evander Holyfield",
  "Billy Conn",
  "Deyontay Wilder",
  "Anthony Joshua",
  "Emile Griffith",
  "Jake LaMotta",
  "Joe Frazier",
  "Pernell Whitaker",
  "Sandy Saddler",
  "Ruben Olivares",
  "Marvin Hagler",
  "Marcel Cerdan",
  "Ezzard Charles",
  "Julio Cesar Chavez",
  "George Foreman",
  "Archie Moore",
  "Rocky Marciano",
  "Sugar Ray Leonard",
  "Roberto Duran",
  "Floyd Mayweather Jr",
  "Joe Louis",
  "Willie Pep",
  "Muhammad Ali",
  "Henry Armstrong",
  "Sugar Ray Robinson"
];

// Pause between API calls for rate limits
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch a fighter by name from Boxing Data API
async function fetchFighterByName(name: string) {
  const url = `https://${API_HOST}/v2/fighters?name=${encodeURIComponent(name)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-host": API_HOST!,
      "x-rapidapi-key": API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`API responded with ${response.status} for "${name}"`);
  }

  const json = (await response.json()) as BoxingDataListResponse;
  return json.data[0] ?? null;
}

async function main() {
  if (!API_HOST || !API_KEY) {
    throw new Error(
      "BOXING_DATA_API_HOST and BOXING_DATA_API_KEY must be set in .env",
    );
  }

  console.log(`Starting seed for ${FIGHTER_NAMES.length} fighters...\n`);

  // Pre-fetch all existing fighter IDs so we know which are new (need dailyOrder)
  const existingIds = new Set(
    (await db.fighter.findMany({ select: { id: true } })).map((f) => f.id),
  );
  const { _max } = await db.fighter.aggregate({ _max: { dailyOrder: true } });
  let orderCounter = (_max.dailyOrder ?? 0) + 1;

  let saved = 0;
  let skipped = 0;
  let failed = 0;

  for (const name of FIGHTER_NAMES) {
    process.stdout.write(`Fetching: ${name} ... `);

    try {
      // Fetches fighter data from API
      const fighter = await fetchFighterByName(name);

      // If no fighter data is found, skip
      if (!fighter) {
        console.log("no results, skipping.");
        skipped++;
        continue;
      }

      // Assign dailyOrder only for fighters not yet in the database
      const isNew = !existingIds.has(fighter.id);
      const dailyOrderForCreate = isNew ? orderCounter++ : 0;

      // Updates and inserts fighter data
      await db.fighter.upsert({
        where: { id: fighter.id },
        update: {
          name: fighter.name,
          age: fighter.age,
          gender: fighter.gender,
          nickname: fighter.nickname ?? null,
          alias: fighter.alias ?? null,
          nationality: fighter.nationality,
          nationalityCode: fighter.nationality_code,
          stance: fighter.stance,
          debut: fighter.debut,
          height: fighter.height,
          heightCm: fighter.height_cm,
          heightIn: fighter.height_in,
          heightFt: fighter.height_ft,
          reach: fighter.reach,
          reachCm: fighter.reach_cm,
          reachIn: fighter.reach_in,
          wins: fighter.stats.wins,
          losses: fighter.stats.losses,
          draws: fighter.stats.draws,
          totalBouts: fighter.stats.total_bouts ?? null,
          totalRounds: fighter.stats.total_rounds ?? null,
          koWins: fighter.stats.ko_wins ?? null,
          stopped: fighter.stats.stopped ?? null,
          divisionId: fighter.division.id,
          divisionName: fighter.division.name,
          divisionWeightLb: fighter.division.weight_lb ?? null,
          divisionWeightKg: fighter.division.weight_kg ?? null,
          titles: JSON.stringify(fighter.titles ?? []),
        },
        // Creates new fighter data
        create: {
          id: fighter.id,
          name: fighter.name,
          dailyOrder: dailyOrderForCreate,
          age: fighter.age,
          gender: fighter.gender,
          nickname: fighter.nickname ?? null,
          alias: fighter.alias ?? null,
          nationality: fighter.nationality,
          nationalityCode: fighter.nationality_code,
          stance: fighter.stance,
          debut: fighter.debut,
          height: fighter.height,
          heightCm: fighter.height_cm,
          heightIn: fighter.height_in,
          heightFt: fighter.height_ft,
          reach: fighter.reach,
          reachCm: fighter.reach_cm,
          reachIn: fighter.reach_in,
          wins: fighter.stats.wins,
          losses: fighter.stats.losses,
          draws: fighter.stats.draws,
          totalBouts: fighter.stats.total_bouts ?? null,
          totalRounds: fighter.stats.total_rounds ?? null,
          koWins: fighter.stats.ko_wins ?? null,
          stopped: fighter.stats.stopped ?? null,
          divisionId: fighter.division.id,
          divisionName: fighter.division.name,
          divisionWeightLb: fighter.division.weight_lb ?? null,
          divisionWeightKg: fighter.division.weight_kg ?? null,
          titles: JSON.stringify(fighter.titles ?? []),
        },
      });

      console.log(`saved (${fighter.name}).`);
      saved++;
    } catch (err) {
      console.log("error.");
      console.error(`  -> ${String(err)}`);
      failed++;
    }

    await sleep(1000);
  }

  // Log the results
  console.log(`\nDone. Saved: ${saved}, Skipped: ${skipped}, Failed: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
