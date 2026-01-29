
import { User, UserRole } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'Upender', name: 'Upender', password: 'Pass999', role: UserRole.ADMIN },
  { id: 'Akhil', name: 'Akhil', password: 'Pass666', role: UserRole.USER },
  { id: 'Nagaraju', name: 'Nagaraju', password: 'Pass555', role: UserRole.USER },
  { id: 'Ameer', name: 'Ameer', password: 'Pass333', role: UserRole.USER },
  { id: 'Arun', name: 'Arun', password: 'Pass222', role: UserRole.USER },
  { id: 'Vijay', name: 'Vijay', password: 'Pass111', role: UserRole.USER },
];

export const EXCEL_COLUMNS = [
  "Part Number",
  "Part Name",
  "On Hand",
  "On Order",
  "Due In Qty",
  "Location",
  "MAV",
  "AMD3",
  "Sys Gen Stock"
];
