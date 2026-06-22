export interface UserSession {
  id: string;
  name: string;
  email?: string | null;
  nickname?: string | null;
  userPermissions?: string | null;
  teamId?: number | null;
}
