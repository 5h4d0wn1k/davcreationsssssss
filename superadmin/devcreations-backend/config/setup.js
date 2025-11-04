import { connectDB } from "./db.js";

try {
  await connectDB();
  console.log("Database setup completed. Prisma handles schema validation automatically.");
} catch (error) {
  console.log("Something went wrong while setting up database!", error);
}
