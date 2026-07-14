export interface GameRule {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  sportType?: string;
  playersPerTeam?: number;
  substitution?: {
    allowed?: boolean;
    maxSubs?: number;
    type?: string;
  };
  serveRule?: {
    style?: string;
    serviceSequence?: string;
    letServePolicy?: string;
    alternateGender?: boolean;
  };
  doubleBounceRule?: boolean;
  nonVolleyZone?: {
    enabled?: boolean;
    depth?: number;
  };
  hasVAR?: boolean;
  customRules?: string;
  status?: "actived" | "inactived";
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
