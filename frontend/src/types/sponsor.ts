interface Person {
  name?: string;
  email?: string;
  phone?: string;
}

export interface Sponsor {
  _id?: string;
  id?: string;
  name: string;
  logo?: string;
  website?: string;
  tournamentItemId?: string;
  sponsorType?: "Diamond" | "Gold" | "Silver" | "Bronze" | "Other" | string;
  sponsorshipType?: "Money" | "Goods" | "Services" | string;
  amount?: number;
  contactPerson?: Person;
  status?: "actived" | "inactive";
  // FE cũ có description/tournamentId; BE hiện chưa có, giữ optional để không vỡ mock.
  description?: string;
  tournamentId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
