"use client";

import { User } from "firebase/auth";
import { createContext } from "react";

export type UserRole = "farmer" | "owner" | "buyer";

export interface UserProfile {
  uid: string;
  name: string;
  role: UserRole;
  phoneNumber: string;
  district: string;
  state: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
