export interface RefereeSport {
    category: string;
    yearsOfExperience: number;
}

export interface Referee {
    id: string;
    userId: string; // Ref to User
    phoneNumber: string;
    name: string;
    birthDate: Date;
    gender: 'male' | 'female' | 'other';
    sports: RefereeSport[];
    createdAt: string;
    updatedAt: string;
}