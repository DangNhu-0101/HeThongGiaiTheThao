export interface Organization {
    _id: string;
    ownerId: string; // Ref to User
    name: string;
    logo?: string;
    website?: string;
    contactEmail: string;
    location: {
        city?: string;
        district?: string;
        detail?: string;
    };
    contactPhone: string;
    createdAt: string;
    updatedAt: string;
}