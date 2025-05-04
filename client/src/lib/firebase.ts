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
  
  // Create firebase authentication account first
  let userCredential;
  try {
    // Create an auth account for the faculty member
    userCredential = await createUserWithEmailAndPassword(
      auth, 
      faculty.email, 
      faculty.password
    );
    
    console.log("Created authentication account for faculty:", faculty.email);
  } catch (authError: any) {
    console.error("Error creating authentication account:", authError);
    throw new Error(`Failed to create account: ${authError.message}`);
  }
  
  const facultyRef = collection(db, "faculty");
  
  // Basic document that should always work, omit password from Firestore
  const { password, ...facultyWithoutPassword } = faculty;
  const facultyData = {
    ...facultyWithoutPassword,
    uid: userCredential.user.uid, // Store the authentication UID
    createdAt: serverTimestamp(),
    status: "active"
  };
  
  // Try to add the createdBy field, but continue even if we can't
  try {
    return await addDoc(facultyRef, {
      ...facultyData,
      createdBy: auth.currentUser.uid // Track who created this document
    });
  } catch (error) {
    console.warn("Could not add createdBy, trying without it");
    // If that fails, try without the createdBy field
    return addDoc(facultyRef, facultyData);
  }
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
  
  // Verify document exists
  const docSnap = await getDoc(facultyRef);
  if (!docSnap.exists()) {
    throw new Error("Faculty document doesn't exist");
  }
  
  // Get existing data to merge with updates
  const existingData = docSnap.data();
  
  // Basic updates that should always work - merge with existing data
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  
  console.log("Updating faculty with data:", updateData);
  
  try {
    // First attempt - with updatedBy
    await updateDoc(facultyRef, {
      ...updateData,
      updatedBy: auth.currentUser.uid
    });
    console.log("Faculty updated successfully with updatedBy");
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(facultyRef);
    return { id, ...updatedDoc.data() };
  } catch (error) {
    console.warn("Could not update with updatedBy, trying without it:", error);
    
    // Second attempt - without updatedBy
    await updateDoc(facultyRef, updateData);
    console.log("Faculty updated successfully without updatedBy");
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(facultyRef);
    return { id, ...updatedDoc.data() };
  }
};

export const deleteFaculty = async (id: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
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
  
  // Verify document exists
  const docSnap = await getDoc(studentRef);
  if (!docSnap.exists()) {
    throw new Error("Student document doesn't exist");
  }
  
  // Basic updates that should always work - merge with existing data
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  
  console.log("Updating student with data:", updateData);
  
  try {
    // First attempt - with updatedBy
    await updateDoc(studentRef, {
      ...updateData,
      updatedBy: auth.currentUser.uid
    });
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(studentRef);
    return { id, ...updatedDoc.data() };
  } catch (error) {
    console.warn("Could not update with updatedBy, trying without it:", error);
    
    // Second attempt - without updatedBy
    await updateDoc(studentRef, updateData);
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(studentRef);
    return { id, ...updatedDoc.data() };
  }
};

export const deleteStudent = async (id: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const studentRef = doc(db, "students", id);
  return deleteDoc(studentRef);
};

export const getInternshipList = async () => {
  try {
    // Get all internships
    const internshipsRef = collection(db, "internships");
    const snapshot = await getDocs(internshipsRef);
    const internships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get all faculty
    const facultyRef = collection(db, "faculty");
    const facultySnapshot = await getDocs(facultyRef);
    const facultyMap: Record<string, string> = {};
    
    facultySnapshot.docs.forEach(doc => {
      const facultyData = doc.data();
      facultyMap[doc.id] = facultyData.name;
    });
    
    // Attach faculty names to internships
    return internships.map(internship => {
      const typedInternship: any = internship;
      if (typedInternship.facultyId && facultyMap[typedInternship.facultyId]) {
        return {
          ...typedInternship,
          facultyName: facultyMap[typedInternship.facultyId]
        };
      }
      return typedInternship;
    });
  } catch (error) {
    console.error("Error fetching internship list with faculty names:", error);
    throw error;
  }
};

export const updateInternship = async (id: string, data: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const internshipRef = doc(db, "internships", id);
  
  // Verify document exists
  const docSnap = await getDoc(internshipRef);
  if (!docSnap.exists()) {
    throw new Error("Internship document doesn't exist");
  }
  
  // Get existing faculty ID if present
  const existingData = docSnap.data();
  const facultyId = existingData.facultyId;
  
  // Basic updates that should always work - merge with existing data
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  
  console.log("Updating internship with data:", updateData);
  
  try {
    // First attempt - with updatedBy
    await updateDoc(internshipRef, {
      ...updateData,
      updatedBy: auth.currentUser.uid
    });
    
    // If this internship is associated with a faculty member, update their counter
    if (facultyId && !data.facultyId) {
      // This means we're keeping the same faculty
      try {
        await updateFacultyInternshipCount(facultyId);
      } catch (error) {
        console.warn("Failed to update faculty internship count:", error);
      }
    } else if (data.facultyId && facultyId !== data.facultyId) {
      // Faculty changed, update both old and new faculty counts
      try {
        if (facultyId) await updateFacultyInternshipCount(facultyId);
        await updateFacultyInternshipCount(data.facultyId);
      } catch (error) {
        console.warn("Failed to update faculty internship counts:", error);
      }
    }
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(internshipRef);
    return { id, ...updatedDoc.data() };
  } catch (error) {
    console.warn("Could not update with updatedBy, trying without it:", error);
    
    // Second attempt - without updatedBy
    await updateDoc(internshipRef, updateData);
    
    // Same faculty update logic as above
    if (facultyId && !data.facultyId) {
      try {
        await updateFacultyInternshipCount(facultyId);
      } catch (error) {
        console.warn("Failed to update faculty internship count:", error);
      }
    } else if (data.facultyId && facultyId !== data.facultyId) {
      try {
        if (facultyId) await updateFacultyInternshipCount(facultyId);
        await updateFacultyInternshipCount(data.facultyId);
      } catch (error) {
        console.warn("Failed to update faculty internship counts:", error);
      }
    }
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(internshipRef);
    return { id, ...updatedDoc.data() };
  }
};

export const deleteInternship = async (id: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const internshipRef = doc(db, "internships", id);
  return deleteDoc(internshipRef);
};

export const createTest = async (test: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const testsRef = collection(db, "tests");
  
  // Basic document that should always work
  const testData = {
    ...test,
    createdAt: serverTimestamp(),
    status: "active"
  };
  
  // Try to add the createdBy field, but continue even if we can't
  try {
    return await addDoc(testsRef, {
      ...testData,
      createdBy: auth.currentUser.uid // Track who created this document
    });
  } catch (error) {
    console.warn("Could not add createdBy, trying without it");
    // If that fails, try without the createdBy field
    return addDoc(testsRef, testData);
  }
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
  
  // Verify document exists
  const docSnap = await getDoc(testRef);
  if (!docSnap.exists()) {
    throw new Error("Test document doesn't exist");
  }
  
  // Basic updates that should always work - merge with existing data
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  
  console.log("Updating test with data:", updateData);
  
  try {
    // First attempt - with updatedBy
    await updateDoc(testRef, {
      ...updateData,
      updatedBy: auth.currentUser.uid
    });
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(testRef);
    return { id, ...updatedDoc.data() };
  } catch (error) {
    console.warn("Could not update with updatedBy, trying without it:", error);
    
    // Second attempt - without updatedBy
    await updateDoc(testRef, updateData);
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(testRef);
    return { id, ...updatedDoc.data() };
  }
};

export const deleteTest = async (id: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const testRef = doc(db, "tests", id);
  return deleteDoc(testRef);
};

export const assignTest = async (assignment: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const assignmentsRef = collection(db, "testsAssigned");
  
  // Basic document that should always work
  const assignmentData = {
    ...assignment,
    assignedAt: serverTimestamp(),
    status: "assigned"
  };
  
  // Try to add the assignedBy field, but continue even if we can't
  try {
    return await addDoc(assignmentsRef, {
      ...assignmentData,
      assignedBy: auth.currentUser.uid // Track who assigned this test
    });
  } catch (error) {
    console.warn("Could not add assignedBy, trying without it");
    // If that fails, try without the assignedBy field
    return addDoc(assignmentsRef, assignmentData);
  }
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
  
  // First, get the faculty data to create a lookup map
  getDocs(collection(db, "faculty")).then(facultySnapshot => {
    const facultyMap: Record<string, string> = {};
    facultySnapshot.docs.forEach(doc => {
      const facultyData = doc.data();
      facultyMap[doc.id] = facultyData.name;
    });
    
    // Now set up the real-time listener with faculty names attached
    return onSnapshot(internshipsRef, (snapshot) => {
      const internships = snapshot.docs.map(doc => {
        const data = doc.data();
        const internship: any = { id: doc.id, ...data };
        
        // Attach faculty name if available
        if (internship.facultyId && facultyMap[internship.facultyId]) {
          internship.facultyName = facultyMap[internship.facultyId];
        }
        
        return internship;
      });
      
      callback(internships);
    });
  }).catch(error => {
    console.error("Error setting up internships listener with faculty data:", error);
    
    // Fallback to basic listener if faculty lookup fails
    return onSnapshot(internshipsRef, (snapshot) => {
      const internships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(internships);
    });
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

// Helper function to update faculty internship count
export const updateFacultyInternshipCount = async (facultyId: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  console.log(`Updating internship count for faculty ID: ${facultyId}`);
  
  try {
    // Get all internships for this faculty
    const internshipsRef = collection(db, "internships");
    const q = query(internshipsRef, where("facultyId", "==", facultyId));
    const snapshot = await getDocs(q);
    const count = snapshot.size;
    
    console.log(`Found ${count} internships for faculty ID: ${facultyId}`);
    
    // Update the faculty document with the count
    const facultyRef = doc(db, "faculty", facultyId);
    
    // Check if faculty exists
    const facultyDoc = await getDoc(facultyRef);
    if (!facultyDoc.exists()) {
      throw new Error(`Faculty document with ID ${facultyId} doesn't exist`);
    }
    
    // Update the count
    await updateDoc(facultyRef, {
      internshipsPosted: count,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Successfully updated internship count to ${count} for faculty ID: ${facultyId}`);
    
    return count;
  } catch (error) {
    console.error(`Error updating internship count for faculty ID: ${facultyId}`, error);
    throw error;
  }
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
