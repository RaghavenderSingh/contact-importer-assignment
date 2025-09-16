import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "./firebase";

export const authService = {
  signInAnonymously: async () => {
    try {
      const result = await signInAnonymously(auth);
      console.log("Signed in anonymously:", result.user.uid);
      return result.user;
    } catch (error) {
      console.error("Anonymous sign-in failed:", error);
      throw error;
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Signed in with email:", result.user.email);
      return result.user;
    } catch (error) {
      console.error("Email sign-in failed:", error);
      throw error;
    }
  },

  createUser: async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User created:", result.user.email);
      return result.user;
    } catch (error) {
      console.error("User creation failed:", error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await signOut(auth);
      console.log("Signed out successfully");
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  },

  getCurrentUser: () => {
    return auth.currentUser;
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};
