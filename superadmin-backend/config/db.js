import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected");
  } catch (error) {
    console.log(error);
    console.log("Could Not Connect to the Database");
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("DB client disconnected");
  process.exit(0);
});

export default prisma;
