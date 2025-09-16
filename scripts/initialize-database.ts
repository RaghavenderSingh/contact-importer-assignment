import { contactFieldService } from "../lib/collections";

async function initializeDatabase() {
  try {
    console.log("🚀 Initializing database...");

    // Initialize core contact fields
    await contactFieldService.initializeCoreFields();
    console.log("✅ Core contact fields initialized");

    // Get all fields to verify
    const fields = await contactFieldService.getFields();
    console.log(
      "📋 Available fields:",
      fields.map((f) => `${f.label} (${f.fieldName})`)
    );

    console.log("🎉 Database initialization complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

initializeDatabase();
