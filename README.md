# Contact Importer - Smart Field Mapping

Ever struggled with importing contacts from CSV files and having to manually map every single column? This tool solves that problem by automatically figuring out which columns should map to which fields in your contact system. It's built with Next.js, TypeScript, Firebase, and Tailwind CSS.

## What This Does

### The Smart Stuff

- **Intelligent Field Mapping**: Upload a CSV and watch it automatically suggest which columns are names, emails, phones, etc. It's pretty good at guessing!
- **File Support**: Works with CSV and Excel files - just drag and drop them in
- **No Duplicates**: If someone already exists (same phone or email), it merges the data instead of creating duplicates
- **Agent Assignment**: Automatically assigns contacts to agents based on email addresses
- **Handles Big Files**: Processes large files in chunks so your browser doesn't crash

### User Experience

- **Simple 3-Step Process**: Upload → Review Mappings → Import. That's it.
- **Confidence Indicators**: Shows you how sure it is about each mapping with color coding
- **Live Validation**: Catches errors as you go, no surprises at the end
- **Works Everywhere**: Desktop, tablet, phone - it all works

### Managing Your Data

- **View Contacts**: Search, filter, and browse all your contacts
- **Manage Users**: Add agents and admins to assign contacts to
- **Custom Fields**: Create your own fields while keeping the important ones protected
- **Import History**: See what you've imported and when

## Getting Started

### What You'll Need

- Node.js 18 or newer
- A Firebase project (it's free and takes 2 minutes to set up)

### Setup Steps

1. **Get the code and install everything:**

```bash
git clone <repository-url>
cd contact-importer-assignment
npm install
```

2. **Set up Firebase:**
   - Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project
   - Enable Firestore Database (it's in the left sidebar)
   - Go to Project Settings → General → Your apps → Web app
   - Copy the config values and put them in a `.env.local` file:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. **Set up the database:**

```bash
npm run setup:db
```

4. **Add some test data (optional but helpful):**

```bash
npm run setup:sample
```

5. **Start the app:**

```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)** and you're ready to go!

## How the Data is Organized

The app uses Firebase Firestore to store everything. Here's what each collection does:

**`/contacts`** - All your contact records

```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  agentUid?: string;        // Which agent this contact belongs to
  createdOn: Timestamp;
  updatedOn?: Timestamp;
  source: "import" | "manual";
  [customField: string]: any; // Any custom fields you create
}
```

**`/contactFields`** - Field definitions (what fields are available)

```typescript
{
  id: string;
  label: string;           // What users see (e.g., "First Name")
  fieldName: string;       // Internal name (e.g., "firstName")
  type: "text" | "number" | "phone" | "email" | "datetime" | "checkbox";
  core: boolean;           // Can't delete these (like firstName, email)
  required?: boolean;
  createdOn: Timestamp;
}
```

**`/users`** - Your team members (agents and admins)

```typescript
{
  uid: string;
  name: string;
  email: string;
  role?: "admin" | "agent";
  active: boolean;
  createdOn: Timestamp;
}
```

**`/importSessions`** - Keeps track of your imports

```typescript
{
  id: string;
  fileName: string;
  totalRows: number;
  mappedFields: Record<string, string>;
  status: "processing" | "completed" | "failed";
  results: {
    imported: number;
    merged: number;
    errors: number;
    errorDetails?: Array<{row: number; error: string; data: any}>;
  };
  createdBy: string;
  createdOn: Timestamp;
}
```

## How the Smart Field Mapping Works

The field mapping logic tries to be smart about guessing which columns map to which fields:

### How It Detects Mappings

1. **Header Matching**: Uses fuzzy string matching to compare CSV headers with known field names (e.g., "mobile number" → phone)
2. **Data Pattern Recognition**: Looks at the actual data using regex patterns to detect emails, phone numbers, dates
3. **Confidence Scoring**: Calculates a score (0-100%) based on how confident it is about each mapping
4. **Agent Detection**: Matches email addresses in the data to users in the system to populate agentUid

### Confidence Levels (Color Coded)

- **High (90%+)**: Green - Pretty sure this is right based on header and data patterns
- **Good (70-89%)**: Blue - Good match but might want to double-check
- **Medium (50-69%)**: Orange - Partial match, probably needs manual review
- **Low (<50%)**: Red - Not confident at all, likely needs manual mapping

## File Requirements

### What Files Work

- **CSV**: Standard comma-separated files (UTF-8 encoding)
- **Excel**: .xlsx and .xls files

### File Constraints

- **Size**: Max 10MB (browser memory limits)
- **Headers**: First row needs to be column names
- **Required Data**: At least one of firstName, lastName, email, or phone must be present
- **Agent Emails**: If you want agent assignment, use email addresses that exist in your users collection

### Example CSV Structure

```csv
First Name,Last Name,Email,Phone,Company,Assigned Agent
John,Doe,john.doe@example.com,555-0123,Acme Corp,sarah.johnson@example.com
Jane,Smith,jane.smith@example.com,555-0124,Tech Inc,mike.wilson@example.com
```

## Available Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database setup
npm run setup:db        # Initialize core contact fields
npm run setup:sample    # Create sample users and contacts

# Testing
npm run test:firebase   # Test Firebase connection
npm run lint            # Run ESLint
```

## UI Structure

### Main Layout

- **Header**: App title and import button
- **Tabs**: Switch between Contacts, Users, and Fields management
- **Responsive**: Works on different screen sizes

### Import Flow (3 Steps)

1. **Upload**: Drag and drop file with validation
2. **Mapping**: Review/change field mappings with confidence indicators
3. **Processing**: Real-time progress with batch processing
4. **Summary**: Shows results, errors, and what happened

### Data Tables

- **Contacts**: View all contacts with search/filter and agent names
- **Users**: Add/edit agents and admins
- **Fields**: Manage custom fields (core fields are protected)

## Security & Data Handling

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Core fields cannot be deleted
    match /contactFields/{fieldId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if !resource.data.core;
    }

    // Users can read all contacts
    match /contacts/{contactId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if true;
    }

    // Users management
    match /users/{userId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if true;
    }
  }
}
```

### Data Privacy Notes

- Files are processed client-side (not stored on server)
- Field mapping happens locally without sending data anywhere
- Contact data is encrypted in Firestore
- No sensitive data is logged

## Deployment

### Vercel (Easiest)

1. Connect your GitHub repo to Vercel
2. Add your Firebase environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Other Options

- **Netlify**: Works with Next.js static export
- **Firebase Hosting**: Native Firebase integration
- **AWS/GCP**: Standard Node.js deployment

## Performance Notes

### What I Optimized

- **Client-side Processing**: Files are parsed in the browser, not on server
- **Chunked Operations**: Firestore writes are batched to avoid hitting limits
- **Memoization**: Field mapping calculations are cached
- **Lazy Loading**: Contacts table loads data on demand
- **Debounced Search**: Search doesn't fire on every keystroke

### Known Limits

- **File Size**: 5-10MB recommended (browser memory limits)
- **Records**: 1000-5000 contacts per import (Firestore batch limits)
- **Concurrent Users**: Firestore handles this automatically

## Testing

### Sample Data

- Run `npm run setup:sample` to create test users and contacts
- Sample CSV file included: `sample-contacts.csv`
- Test with different file formats and edge cases

### What I Tested

1. **File Upload**: CSV and Excel files of various sizes
2. **Field Mapping**: How accurate the smart mapping is
3. **Deduplication**: Merge logic with duplicate contacts
4. **Agent Assignment**: Email-to-UID mapping works correctly
5. **Error Handling**: Malformed files and invalid data

## Future Improvements

### Things I'd Add Next

- **Real-time Collaboration**: Multiple users importing at once
- **Advanced Validation**: Custom validation rules per field
- **Scheduled Imports**: Automated imports from external sources
- **Audit Logging**: Track all changes and imports
- **Analytics**: Import success rates, data quality metrics
- **API Integration**: Direct imports from other CRM systems

### Analytics Features

- Contact source tracking
- Agent performance metrics
- Data quality scoring
- Import success analytics

## Code Structure

### Key Files

- **File Processing**: `lib/file-processing.ts` - Handles CSV/Excel parsing
- **Field Mapping**: `lib/field-mapping.ts` - Smart mapping logic
- **Database Operations**: `lib/collections.ts` - Firestore operations
- **Type Definitions**: `types/firestore.ts` - TypeScript types

### Main Components

- **ImportModal**: The 3-step import flow
- **ContactsTable**: Display contacts with search/filter
- **UserManagement**: Add/edit agents and admins
- **FieldManagement**: Manage custom fields

## Troubleshooting

### Common Issues

**Firebase Connection Problems**

```bash
npm run test:firebase  # Check Firebase configuration
```

**Import Failures**

- Check file format and size limits
- Make sure required fields are present
- Look at error details in the import summary

**Field Mapping Problems**

- Headers need to be in the first row
- Check for special characters in field names
- Verify data patterns match expected types

### Debug Mode

```bash
npm run debug:firebase  # Debug Firebase connection issues
```

## Assignment Completion

This project implements the required features for the Contact Importer assignment:

- ✅ Smart field mapping with auto-suggestions
- ✅ CSV/Excel file upload and processing
- ✅ Agent email mapping to UIDs
- ✅ Contact deduplication (merge on phone/email)
- ✅ Import summary with created/merged/skipped counts
- ✅ Custom field management with core field protection
- ✅ User management for agents
- ✅ Contacts table with agent names
- ✅ Loading states and progress indicators

---

**Built with Next.js, TypeScript, Firebase, and Tailwind CSS**
