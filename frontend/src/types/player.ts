export interface PlayerSport {
    category: string;
    level: string;
    position: string;
}

export interface Player {
    _id: string;
    userId: string; // Ref to User
    name: string;
    birthDate: Date;
    gender: 'male' | 'female' | 'other';
    sports: PlayerSport[];
    status: 'Active' | 'injured' | 'unavailable' | 'deleted';
    createdAt: string;
    updatedAt: string;
}