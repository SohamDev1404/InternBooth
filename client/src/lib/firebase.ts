import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  // If app already exists, use the existing one
  if (error.code === 'app/duplicate-app') {
    app = initializeApp(firebaseConfig, 'superAdminApp');
  } else {
    throw error;
  }
}
const auth = getAuth(app);
const db = getFirestore(app);

// Authentication functions
export const loginWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const createAccount = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  return signOut(auth);
};

// Firestore functions
export const createFaculty = async (faculty: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const facultyRef = collection(db, "faculty");
  return addDoc(facultyRef, {
    ...faculty,
    createdAt: serverTimestamp(),
    status: "active",
    createdBy: auth.currentUser.uid // Track who created this document
  });
};

export const getFacultyList = async () => {
  const facultyRef = collection(db, "faculty");
  const snapshot = await getDocs(facultyRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateFaculty = async (id: string, data: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const facultyRef = doc(db, "faculty", id);
  return updateDoc(facultyRef, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser.uid // Track who updated this document
  });
};

export const deleteFaculty = async (id: string) => {
  const facultyRef = doc(db, "faculty", id);
  return deleteDoc(facultyRef);
};

export const getStudentList = async () => {
  const studentsRef = collection(db, "students");
  const snapshot = await getDocs(studentsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateStudent = async (id: string, data: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const studentRef = doc(db, "students", id);
  return updateDoc(studentRef, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser.uid // Track who updated this document
  });
};

export const deleteStudent = async (id: string) => {
  const studentRef = doc(db, "students", id);
  return deleteDoc(studentRef);
};

export const getInternshipList = async () => {
  const internshipsRef = collection(db, "internships");
  const snapshot = await getDocs(internshipsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateInternship = async (id: string, data: any) => {
  const internshipRef = doc(db, "internships", id);
  return updateDoc(internshipRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteInternship = async (id: string) => {
  const internshipRef = doc(db, "internships", id);
  return deleteDoc(internshipRef);
};

export const createTest = async (test: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const testsRef = collection(db, "tests");
  return addDoc(testsRef, {
    ...test,
    createdAt: serverTimestamp(),
    status: "active",
    createdBy: auth.currentUser.uid // Track who created this document
  });
};

export const getTestsList = async () => {
  const testsRef = collection(db, "tests");
  const snapshot = await getDocs(testsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateTest = async (id: string, data: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const testRef = doc(db, "tests", id);
  return updateDoc(testRef, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser.uid // Track who updated this document
  });
};

export const deleteTest = async (id: string) => {
  const testRef = doc(db, "tests", id);
  return deleteDoc(testRef);
};

export const assignTest = async (assignment: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const assignmentsRef = collection(db, "testsAssigned");
  return addDoc(assignmentsRef, {
    ...assignment,
    assignedAt: serverTimestamp(),
    status: "assigned",
    assignedBy: auth.currentUser.uid // Track who assigned this test
  });
};

export const getTestAssignments = async () => {
  const assignmentsRef = collection(db, "testsAssigned");
  const snapshot = await getDocs(assignmentsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getApplications = async () => {
  const applicationsRef = collection(db, "applications");
  const snapshot = await getDocs(applicationsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getActiveUserCount = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const studentsRef = collection(db, "students");
  const facultyRef = collection(db, "faculty");
  
  // Get active students
  const studentQuery = query(studentsRef, where("lastActive", ">=", today));
  const studentSnapshot = await getDocs(studentQuery);
  
  // Get active faculty
  const facultyQuery = query(facultyRef, where("lastActive", ">=", today));
  const facultySnapshot = await getDocs(facultyQuery);
  
  return studentSnapshot.size + facultySnapshot.size;
};

// Realtime listeners
export const onStudentsChange = (callback: (students: any[]) => void) => {
  const studentsRef = collection(db, "students");
  return onSnapshot(studentsRef, (snapshot) => {
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(students);
  });
};

export const onFacultyChange = (callback: (faculty: any[]) => void) => {
  const facultyRef = collection(db, "faculty");
  return onSnapshot(facultyRef, (snapshot) => {
    const faculty = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(faculty);
  });
};

export const onInternshipsChange = (callback: (internships: any[]) => void) => {
  const internshipsRef = collection(db, "internships");
  return onSnapshot(internshipsRef, (snapshot) => {
    const internships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(internships);
  });
};

export const onApplicationsChange = (callback: (applications: any[]) => void) => {
  const applicationsRef = collection(db, "applications");
  return onSnapshot(applicationsRef, (snapshot) => {
    const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(applications);
  });
};

export const onTestsChange = (callback: (tests: any[]) => void) => {
  const testsRef = collection(db, "tests");
  return onSnapshot(testsRef, (snapshot) => {
    const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tests);
  });
};

export const onTestAssignmentsChange = (callback: (assignments: any[]) => void) => {
  const assignmentsRef = collection(db, "testsAssigned");
  return onSnapshot(assignmentsRef, (snapshot) => {
    const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(assignments);
  });
};

// Helper function for handling Firebase errors
export const handleFirebaseError = (error: any): string => {
  console.error("Firebase error:", error);
  
  if (error.code === 'permission-denied') {
    return "You don't have permission to perform this action. Please contact your administrator.";
  } 
  
  if (error.code?.includes('auth/')) {
    return `Authentication error: ${error.message}`;
  }
  
  if (error.code?.includes('firestore/')) {
    return `Database error: ${error.message}`;
  }
  
  return error.message || "An unexpected error occurred. Please try again.";
};

export { auth, db };
