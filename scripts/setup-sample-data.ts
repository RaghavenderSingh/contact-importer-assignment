import { userService, contactService } from "../lib/collections";
import { Timestamp } from "firebase/firestore";

async function setupSampleData() {
  try {
    console.log("🚀 Setting up sample data...");

    // Create sample users
    const sampleUsers = [
      {
        uid: "user1",
        name: "John Smith",
        email: "john.smith@example.com",
        role: "admin" as const,
        active: true,
        createdOn: Timestamp.now(),
      },
      {
        uid: "user2",
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        role: "agent" as const,
        active: true,
        createdOn: Timestamp.now(),
      },
      {
        uid: "user3",
        name: "Mike Wilson",
        email: "mike.wilson@example.com",
        role: "agent" as const,
        active: true,
        createdOn: Timestamp.now(),
      },
    ];

    console.log("👥 Creating sample users...");
    for (const user of sampleUsers) {
      try {
        await userService.createUser({
          name: user.name,
          email: user.email,
          role: user.role,
          active: true,
        });
        console.log(`✅ Created user: ${user.name}`);
      } catch (error) {
        console.log(`⚠️  User might already exist: ${user.name}`);
      }
    }

    // Create sample contacts
    const sampleContacts = [
      {
        firstName: "Alice",
        lastName: "Brown",
        email: "alice.brown@example.com",
        phone: "555-0101",
        agentUid: "user2",
        source: "manual" as const,
      },
      {
        firstName: "Bob",
        lastName: "Davis",
        email: "bob.davis@example.com",
        phone: "555-0102",
        agentUid: "user3",
        source: "manual" as const,
      },
      {
        firstName: "Carol",
        lastName: "Miller",
        email: "carol.miller@example.com",
        phone: "555-0103",
        source: "manual" as const,
      },
    ];

    console.log("📇 Creating sample contacts...");
    for (const contact of sampleContacts) {
      try {
        await contactService.createContactsBatch([contact]);
        console.log(
          `✅ Created contact: ${contact.firstName} ${contact.lastName}`
        );
      } catch (error) {
        console.log(
          `⚠️  Contact might already exist: ${contact.firstName} ${contact.lastName}`
        );
      }
    }

    console.log("🎉 Sample data setup complete!");
    console.log("\n📋 What was created:");
    console.log("• 3 sample users (1 admin, 2 agents)");
    console.log("• 3 sample contacts (2 assigned, 1 unassigned)");
    console.log("\n🔗 You can now:");
    console.log("• View contacts in the Contacts tab");
    console.log("• Manage users in the Users tab");
    console.log("• Test the import functionality");

    process.exit(0);
  } catch (error) {
    console.error("❌ Sample data setup failed:", error);
    process.exit(1);
  }
}

setupSampleData();
