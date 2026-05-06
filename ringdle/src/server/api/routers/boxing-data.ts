import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import type { BoxingDataResponse } from "./types/boxing-data.types";

export const boxingRouter = createTRPCRouter({
  getFighterById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const url = `https://${env.BOXING_DATA_API_HOST}/v2/fighters/${input.id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-host": env.BOXING_DATA_API_HOST,
          "x-rapidapi-key": env.BOXING_DATA_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data from Boxing API");
      }

      const json = await response.json() as BoxingDataResponse;
      console.log("stats:", JSON.stringify(json.data.stats, null, 2));
      return json.data;
    }),
});