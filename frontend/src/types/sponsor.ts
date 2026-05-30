interface Person{
    name: string;
    email: string;
    phone: string;
}


export interface Sponsor {
    id: string;
    name: string;
    logo: string;
    description: string;
    tournamentId: string; // Reference to Tournament
    website: string;
    sponsorType:string;
    amount: number;
    contactPerson: Person;
    createdAt: Date;
    updatedAt: Date;
}