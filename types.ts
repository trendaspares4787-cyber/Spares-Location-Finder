
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  name: string;
  password: string;
  role: UserRole;
  attempts?: number;
  phone?: string; // WhatsApp number for targeted sharing
}

export interface Part {
  partNumber: string;
  partName: string;
  onHand: number;
  onOrder: number;
  dueInQty: number;
  location: string;
  mav: number; // Part Price
  amd3: number;
  sysGenStock: number;
}

export interface AuditLog {
  id: string;
  userName: string;
  dateTime: string;
  partNumber: string;
  partName: string;
  onHandQty: number;
  physicalQty: number;
  currentLocation: string;
  newLocation: string;
  mav: number;
  type: 'VERIFICATION' | 'MODIFICATION' | 'MANUAL';
}

export interface ManualEntry {
  id: string;
  userName: string;
  dateTime: string;
  partNumber: string;
  foundPhysicalQty: number;
  foundLocation: string;
}

export interface AppState {
  currentUser: User | null;
  parts: Part[];
  logs: AuditLog[];
  manualEntries: ManualEntry[];
  users: User[];
  lastUploadInfo: string | null;
  lastCredentials?: { userId: string; password: string };
}
