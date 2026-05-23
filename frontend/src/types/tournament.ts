import type {Sponsor } from "./sponsor";
import type {BaseRule} from "./baseRule";

interface ITimeLine {
    registrationStart: Date;
    registrationEnd: Date;
    tournamentStart: Date;
    tournamentEnd: Date;
}

interface IGalaConfig {
    hasGala: boolean;
    time: Date | null;
    venue: string;
    description: string;
}

interface ILocation {
    city?: string;
    district?: string;
}


export interface Tournament {
    name: string;
    description: string;
    logo: string;
    banner: string;
    sportType: string[];
    timeLine: ITimeLine;
    paymentQR: string;
    prizes: string;
    galaConfig: IGalaConfig;
    location: ILocation;
    baseRule: [BaseRule]; // Array of BaseRule references
    budget: {
        totalSponsor: number;
        totalExpense: number;
    };
    organizer: String; // Reference to Organization
    sponsors: [Sponsor]; // Array of Sponsor references
    status: string; // e.g., "upcoming", "ongoing", "completed"
    createdAt: Date;
    updatedAt: Date;
}