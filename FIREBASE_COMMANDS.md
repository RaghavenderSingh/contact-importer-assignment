# Firebase Commands I Used

This is just a reference of all the Firebase commands I used while building this contact importer assignment. I kept track of them so I wouldn't have to look them up again.

## What's in Here

- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Project Management](#project-management)
- [Firestore Commands](#firestore-commands)
- [Authentication Commands](#authentication-commands)
- [Deployment Commands](#deployment-commands)
- [Environment & Configuration](#environment--configuration)
- [Database Management](#database-management)
- [Monitoring & Logs](#monitoring--logs)
- [Development & Testing](#development--testing)
- [Troubleshooting](#troubleshooting)
- [Quick Start Guide](#quick-start-guide)

## What You Need First

- Node.js 18+ installed
- A Firebase project created
- My project ID was `contact-importer-assignment` (you'll use your own)

## Getting Firebase Set Up

### Install the Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Check if it worked
firebase --version

# Update it if needed
npm update -g firebase-tools
```

### Logging In

```bash
# Login to Firebase
firebase login

# Login with specific account (if you have multiple)
firebase login --email your-email@example.com

# Logout if needed
firebase logout

# See who you're logged in as
firebase login:list
```

### Setting Up Your Project

```bash
# Initialize Firebase in your project
firebase init

# See all your projects
firebase projects:list

# Use your specific project
firebase use contact-importer-assignment

# Add a project with an alias (useful for dev/staging)
firebase use --add

# Remove an alias if you mess up
firebase use --unalias <alias>
```

## Managing Projects

### Basic Project Stuff

```bash
# Create a new Firebase project
firebase projects:create

# Delete a project (can't undo this!)
firebase projects:delete <project-id>

# See all your projects
firebase projects:list

# Switch between projects (if you have aliases set up)
firebase use production
firebase use staging
firebase use development
```

## Firestore Commands

### Rules and Indexes

```bash
# Deploy just the Firestore rules
firebase deploy --only firestore:rules

# Deploy just the indexes
firebase deploy --only firestore:indexes

# Deploy both rules and indexes
firebase deploy --only firestore

# Check if your rules are valid before deploying
firebase firestore:rules:validate
```

### Working with Data

```bash
# Export all your Firestore data (backup)
gcloud firestore export gs://your-bucket/backup

# Import data from a backup
gcloud firestore import gs://your-bucket/backup

# Open the Firestore UI in your browser
firebase firestore:ui

# Delete everything in a collection (be careful!)
firebase firestore:delete --recursive --yes <collection-name>
```

## Authentication Commands

### Auth Setup

```bash
# Deploy Auth configuration
firebase deploy --only auth

# Open the Auth UI in your browser
firebase open auth

# Export all users to a file
firebase auth:export users.json

# Import users from a file
firebase auth:import users.json
```

## Deployment Commands

### Deploying Everything

```bash
# Deploy everything at once
firebase deploy

# Deploy just specific services
firebase deploy --only firestore,auth

# Deploy to a specific project
firebase deploy --project contact-importer-assignment

# See what would be deployed without actually doing it
firebase deploy --dry-run

# Deploy without asking for confirmation
firebase deploy --force
```

### Deploying Specific Parts

```bash
# Deploy only Firestore
firebase deploy --only firestore

# Deploy only Auth
firebase deploy --only auth

# Deploy only Hosting (if you add it later)
firebase deploy --only hosting

# Deploy only Functions (if you add them later)
firebase deploy --only functions
```

## Environment & Configuration

### Environment Variables (for Functions)

```bash
# Set environment variables for Functions
firebase functions:config:set someservice.key="THE API KEY"

# See what's currently set
firebase functions:config:get

# Remove a config setting
firebase functions:config:unset someservice.key

# Set multiple configs at once
firebase functions:config:set someservice.key="value" anotherservice.key="value"
```

### Project Configuration

```bash
# See which project you're currently using
firebase use

# See all your projects and aliases
firebase projects:list

# Set a default project
firebase use --add contact-importer-assignment
```

## Database Management

### Working with Data

```bash
# Export all your Firestore data (backup)
gcloud firestore export gs://contact-importer-assignment-backup/$(date +%Y%m%d)

# Import data from a backup
gcloud firestore import gs://contact-importer-assignment-backup/20240101

# Open Firestore in your browser
firebase firestore:ui

# Query a specific collection
firebase firestore:query --collection contacts
```

### Backup & Restore

```bash
# Create a backup with timestamp
gcloud firestore export gs://your-backup-bucket/backup-$(date +%Y%m%d-%H%M%S)

# Restore from a specific backup
gcloud firestore import gs://your-backup-bucket/backup-20240101-120000

# See what backups you have
gsutil ls gs://your-backup-bucket/
```

## Monitoring & Logs

### Looking at Logs

```bash
# See all logs
firebase functions:log

# See logs for a specific function
firebase functions:log --only functionName

# See logs with limits
firebase functions:log --only functionName --limit 50

# Open the Firebase Console
firebase open

# Open specific services
firebase open firestore
firebase open auth
firebase open hosting
```

### Performance Stuff

```bash
# Open Performance Monitoring
firebase open performance

# See real-time database usage
firebase database:get /
```

## Development & Testing

### Using Emulators

```bash
# Start all emulators
firebase emulators:start

# Start just specific emulators
firebase emulators:start --only firestore,auth

# Start on a different port
firebase emulators:start --port 4000

# Start on a specific host
firebase emulators:start --host 0.0.0.0

# Start in debug mode
firebase emulators:start --debug

# Stop all emulators
firebase emulators:kill

# Start emulators and run tests
firebase emulators:exec --only firestore "npm test"
```

### Testing Commands

```bash
# Run tests with emulators
firebase emulators:exec --only firestore "npm run test"

# Start emulator with UI
firebase emulators:start --ui

# Connect to emulator on specific port
firebase emulators:start --only firestore --port 8080
```

## Troubleshooting

### Common Problems

```bash
# Check Firebase CLI version
firebase --version

# Update Firebase CLI
npm update -g firebase-tools

# Check project status
firebase projects:list

# Debug deployment
firebase deploy --debug

# Check authentication status
firebase login:list

# Clear Firebase cache
firebase logout
firebase login
```

### Debug Commands

```bash
# Verbose deployment
firebase deploy --debug

# Check project configuration
firebase use

# Validate project setup
firebase projects:list

# Check service status
firebase open
```

### When Things Go Wrong

```bash
# Reset local Firebase config
rm -rf .firebase/
firebase init

# Clear all caches
firebase logout
firebase login
npm cache clean --force
```

## Quick Start Guide

### First Time Setup

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize project
firebase init

# 4. Select project
firebase use contact-importer-assignment

# 5. Deploy Firestore rules
firebase deploy --only firestore
```

### Daily Development

```bash
# 1. Start emulators for development
firebase emulators:start

# 2. Make changes to your code
# 3. Test with emulators
# 4. Deploy when ready
firebase deploy --only firestore
```

### Production Deployment

```bash
# 1. Make sure you're on the right project
firebase use contact-importer-assignment

# 2. Deploy everything
firebase deploy

# 3. Verify deployment
firebase open
```

## Commands I Used for This Project

### For Contact Importer Assignment

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Start development with emulators
firebase emulators:start --only firestore,auth

# Open Firestore UI for data management
firebase firestore:ui

# Deploy to production
firebase deploy --project contact-importer-assignment
```

## Environment Variables

You'll need these in your `.env.local` file:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=contact-importer-assignment.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=contact-importer-assignment
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=contact-importer-assignment.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=154933775104
NEXT_PUBLIC_FIREBASE_APP_ID=1:154933775104:web:1608e533f16344c46cc1e5
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-L756XT22W3
```

## Things to Remember

1. **Test with emulators first** before deploying to production
2. **Backup your data** before making major changes
3. **Use specific deployment targets** to avoid deploying everything
4. **Check your firebase.json** configuration before deploying
5. **Watch your usage** to avoid unexpected charges

## Helpful Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firestore Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
