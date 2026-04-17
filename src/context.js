import { createContext, useContext } from "react";
export const AuthCtx = createContext({ isEditor: false, isMobile: false });
export const EDITOR_KEY = "innova2026";
export function useAuth() { return useContext(AuthCtx); }
