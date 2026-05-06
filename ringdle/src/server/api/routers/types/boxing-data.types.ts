export interface BoxingDataFighterStats {
  wins: number;
  losses: number;
  draws: number;
  total_bouts: number;
  total_rounds: number;
  ko_wins?: number;
  stopped?: number;
}

export interface BoxingDataFighterDivision {
  id: string;
  name: string;
  weight_lb: number | null;
  weight_kg: number | null;
}

export interface BoxingDataFighter {
  id: string;
  name: string;
  age: number;
  gender: string;
  height: string;
  height_cm: number;
  height_in: number;
  height_ft: string;
  nationality: string;
  nationality_code: string;
  nickname: string | null;
  reach: string;
  reach_cm: number;
  reach_in: number;
  stance: string;
  debut: string;
  alias?: string | null;
  stats: BoxingDataFighterStats;
  division: BoxingDataFighterDivision;
  titles: string[];
}

export interface BoxingDataResponse {
  metadata: {
    timestamp: string;
  };
  pagination: {
    page: number;
    items: number;
    total_pages: number;
    total_items: number;
  };
  error: object;
  data: BoxingDataFighter;
}
