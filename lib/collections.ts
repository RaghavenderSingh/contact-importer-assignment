import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
  DocumentData,
  QueryConstraint,
  CollectionReference,
} from "firebase/firestore";
import { db } from "./firebase";
import { Contact, ContactField, User, ImportSession } from "../types/firestore";

// Collections
export const contactsRef = collection(db, "contacts");
export const contactFieldsRef = collection(db, "contactFields");
export const usersRef = collection(db, "users");
export const importSessionsRef = collection(db, "importSessions");

// Core contact fields that cannot be deleted
export const CORE_FIELDS: Omit<ContactField, "id">[] = [
  {
    label: "First Name",
    fieldName: "firstName",
    type: "text",
    core: true,
    required: true,
    createdOn: Timestamp.now(),
  },
  {
    label: "Last Name",
    fieldName: "lastName",
    type: "text",
    core: true,
    required: true,
    createdOn: Timestamp.now(),
  },
  {
    label: "Phone",
    fieldName: "phone",
    type: "phone",
    core: true,
    required: true,
    createdOn: Timestamp.now(),
  },
  {
    label: "Email",
    fieldName: "email",
    type: "email",
    core: true,
    required: true,
    createdOn: Timestamp.now(),
  },
  {
    label: "Assigned Agent",
    fieldName: "agentUid",
    type: "text",
    core: true,
    required: false,
    createdOn: Timestamp.now(),
  },
];

// Generic CRUD operations
export const createDocument = async <T extends DocumentData>(
  collectionRef: CollectionReference,
  data: Omit<T, "id">
): Promise<string> => {
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdOn: Timestamp.now(),
  });
  return docRef.id;
};

export const getDocument = async <T extends DocumentData>(
  collectionRef: CollectionReference,
  id: string
): Promise<T | null> => {
  const docRef = doc(collectionRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as T) : null;
};

export const updateDocument = async <T extends DocumentData>(
  collectionRef: CollectionReference,
  id: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(collectionRef, id);
  await updateDoc(docRef, {
    ...data,
    updatedOn: Timestamp.now(),
  });
};

export const deleteDocument = async (
  collectionRef: CollectionReference,
  id: string
): Promise<void> => {
  const docRef = doc(collectionRef, id);
  await deleteDoc(docRef);
};

export const queryDocuments = async <T extends DocumentData>(
  collectionRef: CollectionReference,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  const q = query(collectionRef, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
};

// Contact-specific operations
export const contactService = {
  // Get all contacts with pagination
  getContacts: async (pageSize: number = 50): Promise<Contact[]> => {
    const constraints = [orderBy("createdOn", "desc"), limit(pageSize)];
    return queryDocuments<Contact>(contactsRef, constraints);
  },

  // Search contacts
  searchContacts: async (searchTerm: string): Promise<Contact[]> => {
    // Firestore doesn't support full-text search, so we'll implement client-side filtering
    const allContacts = await queryDocuments<Contact>(contactsRef);
    const term = searchTerm.toLowerCase();

    return allContacts.filter(
      (contact) =>
        contact.firstName?.toLowerCase().includes(term) ||
        contact.lastName?.toLowerCase().includes(term) ||
        contact.email?.toLowerCase().includes(term) ||
        contact.phone?.includes(term)
    );
  },

  // Find contact by phone or email for deduplication
  findContactByPhoneOrEmail: async (
    phone: string,
    email: string
  ): Promise<Contact | null> => {
    const phoneQuery = query(contactsRef, where("phone", "==", phone));
    const emailQuery = query(contactsRef, where("email", "==", email));

    const [phoneSnapshot, emailSnapshot] = await Promise.all([
      getDocs(phoneQuery),
      getDocs(emailQuery),
    ]);

    if (!phoneSnapshot.empty) {
      const doc = phoneSnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Contact;
    }

    if (!emailSnapshot.empty) {
      const doc = emailSnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Contact;
    }

    return null;
  },

  // Batch create contacts
  createContactsBatch: async (
    contacts: Omit<Contact, "id" | "createdOn">[]
  ): Promise<string[]> => {
    const batch = writeBatch(db);
    const docRefs: unknown[] = [];

    contacts.forEach((contact) => {
      const docRef = doc(contactsRef);
      batch.set(docRef, {
        ...contact,
        createdOn: Timestamp.now(),
      });
      docRefs.push(docRef);
    });

    await batch.commit();
    return docRefs.map((ref) => ref.id);
  },

  // Merge contacts (for deduplication)
  mergeContacts: (existing: Contact, newData: Partial<Contact>): Contact => {
    const merged = { ...existing };

    // Only update non-empty fields
    Object.keys(newData).forEach((key) => {
      if (
        key !== "id" &&
        key !== "createdOn" &&
        newData[key as keyof Contact]
      ) {
        merged[key as keyof Contact] = newData[
          key as keyof Contact
        ] as Contact[keyof Contact];
      }
    });

    merged.updatedOn = Timestamp.now();
    return merged;
  },
};

// Contact Field operations
export const contactFieldService = {
  getFields: async (): Promise<ContactField[]> => {
    return queryDocuments<ContactField>(contactFieldsRef, [
      orderBy("createdOn", "asc"),
    ]);
  },

  createField: async (
    field: Omit<ContactField, "id" | "createdOn">
  ): Promise<string> => {
    return createDocument(contactFieldsRef, field);
  },

  updateField: async (
    id: string,
    field: Partial<ContactField>
  ): Promise<void> => {
    return updateDocument(contactFieldsRef, id, field);
  },

  deleteField: async (id: string): Promise<void> => {
    // Check if field is core before deletion
    const field = await getDocument<ContactField>(contactFieldsRef, id);
    if (field?.core) {
      throw new Error("Cannot delete core fields");
    }
    return deleteDocument(contactFieldsRef, id);
  },

  // Initialize core fields if they don't exist
  initializeCoreFields: async (): Promise<void> => {
    const existingFields = await contactFieldService.getFields();
    const existingFieldNames = new Set(existingFields.map((f) => f.fieldName));

    const fieldsToCreate = CORE_FIELDS.filter(
      (field) => !existingFieldNames.has(field.fieldName)
    );

    if (fieldsToCreate.length > 0) {
      const batch = writeBatch(db);
      fieldsToCreate.forEach((field) => {
        const docRef = doc(contactFieldsRef);
        batch.set(docRef, field);
      });
      await batch.commit();
    }
  },
};

// User operations
export const userService = {
  getUsers: async (): Promise<User[]> => {
    return queryDocuments<User>(usersRef, [orderBy("name", "asc")]);
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  },

  createUser: async (
    user: Omit<User, "uid" | "createdOn">
  ): Promise<string> => {
    return createDocument(usersRef, {
      ...user,
      active: true,
    });
  },

  updateUser: async (uid: string, user: Partial<User>): Promise<void> => {
    return updateDocument(usersRef, uid, user);
  },

  deleteUser: async (uid: string): Promise<void> => {
    return deleteDocument(usersRef, uid);
  },
};

// Import Session operations
export const importSessionService = {
  createSession: async (
    session: Omit<ImportSession, "id" | "createdOn">
  ): Promise<string> => {
    return createDocument(importSessionsRef, session);
  },

  updateSession: async (
    id: string,
    session: Partial<ImportSession>
  ): Promise<void> => {
    return updateDocument(importSessionsRef, id, session);
  },

  getSession: async (id: string): Promise<ImportSession | null> => {
    return getDocument<ImportSession>(importSessionsRef, id);
  },

  getSessions: async (): Promise<ImportSession[]> => {
    return queryDocuments<ImportSession>(importSessionsRef, [
      orderBy("createdOn", "desc"),
    ]);
  },
};
