export type UserRole = 'admin' | 'org' | 'organizer' | 'referee' | 'player' | 'user';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  club?: string;
}

export interface User {
  _id: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: UserRole;
  profileData?: UserProfile;
  createdAt?: string;
  updatedAt?: string;
}
