export interface Category{
    id: string;
    categoryType: string;
    Name: string;
    minPlayers: number;
    maxPlayers: number;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}