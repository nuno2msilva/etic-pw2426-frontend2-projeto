import "dotenv/config";
import prisma from "./prisma.js";

async function main() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("DB check: connected");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("DB check: failed");
  console.error(error);
  process.exit(1);
});
