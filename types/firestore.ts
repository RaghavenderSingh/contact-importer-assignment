import { Timestamp } from "firebase/firestore";

export interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  agentUid?: string;
  createdOn: Timestamp;
  updatedOn?: Timestamp;
  source?: "import" | "manual";
  [customField: string]: any;
}

export interface ContactField {
  id: string;
  label: string;
  fieldName: string;
  type: "text" | "number" | "phone" | "email" | "datetime" | "checkbox";
  core: boolean;
  required?: boolean;
  options?: string[];
  createdOn: Timestamp;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role?: "admin" | "agent";
  createdOn: Timestamp;
  active: boolean;
}

export interface ImportSession {
  id?: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  mappedFields: Record<string, string>;
  status: "processing" | "completed" | "failed";
  results: {
    imported: number;
    merged: number;
    errors: number;
    errorDetails?: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  };
  createdBy: string;
  createdOn: Timestamp;
  completedOn?: Timestamp;
}

export interface FieldMapping {
  columnName: string;
  mappedTo: string;
  confidence: number;
  dataType: string;
  sampleData: string[];
  isCustomField: boolean;
  customFieldConfig?: Partial<ContactField>;
}
