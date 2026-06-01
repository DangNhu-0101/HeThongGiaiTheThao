interface Person{
    name: string;
    email: string;
    phone: string;
}


export interface Sponsor {
    _id: string;
    name: string;
    logo: string;
    description: string;
    tournamentId: string; 
    website: string;
    sponsorType:string;
    amount: number;
    sponsorshipType: string;
    contactPerson: Person;
    createdAt: Date;
    updatedAt: Date;
}