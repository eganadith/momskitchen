/**
 * Mama's Kitchen - Database seed script
 * Creates default admin, locations, sample menu items, and system config.
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Default admin user (change password in production)
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@mamaskitchen.lk" },
    update: { phone: "94771234567" },
    create: {
      email: "admin@mamaskitchen.lk",
      phone: "94771234567",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Seeded admin user: email admin@mamaskitchen.lk or phone 94771234567 / password admin123");

  // Delivery locations (quick buttons + Other for custom address)
  const locations = [
    { name: "Hostel A", slug: "hostel-a" },
    { name: "Hostel B", slug: "hostel-b" },
    { name: "Library", slug: "library" },
    { name: "Main Gate", slug: "main-gate" },
    { name: "Lecture Hall", slug: "lecture-hall" },
    { name: "Other", slug: "other" },
  ];
  for (const loc of locations) {
    await prisma.location.upsert({
      where: { slug: loc.slug },
      update: { name: loc.name },
      create: loc,
    });
  }
  console.log("Seeded 6 locations");

  // Sample menu items
  const menuItems = [
    {
      name: "Chicken Rice & Curry",
      description: "Tender chicken with rice and curry",
      priceNormal: 400,
      priceFull: 650,
      category: "LUNCH" as const,
    },
    {
      name: "Fish Rice & Curry",
      description: "Fresh fish with rice and curry",
      priceNormal: 380,
      priceFull: 620,
      category: "LUNCH" as const,
    },
    {
      name: "Egg / Sausage",
      description: "Egg or sausage with rice",
      priceNormal: 350,
      priceFull: 550,
      category: "BREAKFAST" as const,
    },
    {
      name: "Vegetable Rice & Curry",
      description: "Mixed vegetables with rice and curry",
      priceNormal: 300,
      priceFull: 420,
      category: "LUNCH" as const,
    },
    {
      name: "String Hoppers & Curry",
      description: "Traditional string hoppers with curry",
      priceNormal: 320,
      priceFull: 480,
      category: "BREAKFAST" as const,
    },
    {
      name: "Rice & Curry (Dinner)",
      description: "Daily rice and curry special",
      priceNormal: 380,
      priceFull: 600,
      category: "DINNER" as const,
    },
  ];
  const existingMenu = await prisma.menuItem.count();
  if (existingMenu === 0) {
    await prisma.menuItem.createMany({
      data: menuItems.map((item) => ({ ...item, availability: true })),
    });
    console.log("Seeded menu items");
  }

  // System config: menu override off, order limits
  const configs = [
    { key: "menu_override", value: "false" },
    { key: "breakfast_order_limit", value: "100" },
    { key: "lunch_order_limit", value: "100" },
    { key: "dinner_order_limit", value: "100" },
  ];
  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: { value: c.value },
      create: c,
    });
  }
  console.log("Seeded system config");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
