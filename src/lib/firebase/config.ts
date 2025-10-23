// This file is deprecated and will be removed in a future update.
// Please use the functions from '@/firebase' instead.
import { initializeFirebase } from '@/firebase';

const { auth, firestore: db } = initializeFirebase();

export { auth, db };
