import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseAuth, googleProvider, isFirebaseConfigured } from "./firebase";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!firebaseAuth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    if (!firebaseAuth) {
      throw new Error("Firebase is not configured.");
    }
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  }

  async function signUp(email: string, password: string) {
    if (!firebaseAuth) {
      throw new Error("Firebase is not configured.");
    }
    await createUserWithEmailAndPassword(firebaseAuth, email, password);
  }

  async function signInWithGoogle() {
    if (!firebaseAuth || !googleProvider) {
      throw new Error("Firebase is not configured.");
    }
    await signInWithPopup(firebaseAuth, googleProvider);
  }

  async function logOut() {
    if (!firebaseAuth) {
      return;
    }
    await signOut(firebaseAuth);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isConfigured: isFirebaseConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
