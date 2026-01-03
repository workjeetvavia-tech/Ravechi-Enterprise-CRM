import { auth } from './firebaseConfig';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile, 
    signOut, 
    sendEmailVerification,
    sendPasswordResetEmail,
    User as FirebaseUser 
} from 'firebase/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar?: string;
}

// Map Firebase user object to our App's User interface
const mapFirebaseUser = (u: FirebaseUser | null): User | null => {
    if (!u) return null;
    return {
        id: u.uid,
        email: u.email || '',
        name: u.displayName || u.email?.split('@')[0] || 'User',
        role: 'employee',
        avatar: u.photoURL || (u.displayName ? u.displayName.substring(0, 2).toUpperCase() : 'U')
    };
};

export const getCurrentUser = async (): Promise<User | null> => {
    const u = auth.currentUser;
    if (u && u.emailVerified) {
        return mapFirebaseUser(u);
    }
    return null;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            // Send verification email again if needed
            await sendEmailVerification(user);
            await signOut(auth);
            throw new Error("Email not verified");
        }

        return mapFirebaseUser(user)!;
    } catch (error: any) {
        throw error;
    }
};

export const signupUser = async (name: string, email: string, password: string): Promise<void> => {
    try {
        // 1. Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Update Profile Name
        await updateProfile(user, {
            displayName: name
        });

        // 3. Send Verification Email
        await sendEmailVerification(user);

        // 4. Sign Out immediately (so they aren't logged in automatically)
        await signOut(auth);
        
        return; 
    } catch (error: any) {
        throw error;
    }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        throw error;
    }
};

export const clearUserSession = async () => {
    await signOut(auth);
};