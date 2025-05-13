const admin = require("firebase-admin");

// IMPORTANT: You need to have your Firebase service account key file
// Download it from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key

// Replace this path with the actual path to your service account key file
const serviceAccountPath = "./firebase-service-account-key.json";

try {
  // Initialize with explicit service account file
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  console.error("\nPlease make sure:");
  console.error(
    "1. You have downloaded your service account key from Firebase Console"
  );
  console.error(
    "2. You have placed it at: " +
      serviceAccountPath +
      " (or updated the path in this script)"
  );
  console.error(
    "3. The file contains valid JSON with your project credentials\n"
  );
  process.exit(1);
}

const db = admin.firestore();

// --- Vendor Data and Seeding Function ---

const sampleVendors = [
  {
    name: "Bakso Mas Kardi",
    type: "Bakso",
    description:
      "Bakso urat super dengan kuah kaldu sapi asli, mie kuning, bihun, dan sayuran segar.",
    location: { lat: -6.3621, lon: 106.8267 }, // Depok
    status: "active",
    phoneNumber: "081234567890",
    profileImageUrl: "https://placehold.co/400x400/E53935/white?text=BMK",
  },
  {
    name: "Siomay Kang Asep",
    type: "Siomay",
    description:
      "Siomay ikan tenggiri, tahu, kentang, telur, dan pare. Disajikan dengan bumbu kacang legit.",
    location: { lat: -6.3888, lon: 106.8305 }, // Margonda
    status: "active",
    profileImageUrl: "https://placehold.co/400x400/43A047/white?text=SKA",
  },
  {
    name: "Es Cendol Bu Sri",
    type: "Es Cendol",
    description:
      "Es cendol segar dengan santan gurih, gula merah asli, dan nangka.",
    location: { lat: -6.357, lon: 106.819 }, // Beji
    status: "inactive",
    phoneNumber: "087654321098",
    profileImageUrl: "https://placehold.co/400x400/1E88E5/white?text=ECS",
  },
  {
    name: "Nasi Goreng Pak Kumis",
    type: "Nasi Goreng",
    description:
      "Nasi goreng spesial dengan ayam, telur, bakso, dan acar timun wortel.",
    location: { lat: -6.4015, lon: 106.7942 }, // Sawangan
    status: "active",
    profileImageUrl: "https://placehold.co/400x400/FF9800/white?text=NGK",
  },
  {
    name: `Kopi Keliling 'Sinar Pagi'`,
    type: "Minuman Kopi",
    description: "Menyediakan berbagai macam kopi sachet dan minuman dingin.",
    location: { lat: -6.37, lon: 106.825 }, // Stasiun Depok Baru
    status: "active",
    phoneNumber: "089988776655",
    profileImageUrl: "https://placehold.co/400x400/757575/white?text=KSP",
  },
];

async function seedVendors() {
  const vendorsCollection = db.collection("vendors");
  let count = 0;
  for (const vendorData of sampleVendors) {
    try {
      const now = admin.firestore.Timestamp.now();
      await vendorsCollection.add({
        name: vendorData.name,
        type: vendorData.type,
        description: vendorData.description,
        location: new admin.firestore.GeoPoint(
          vendorData.location.lat,
          vendorData.location.lon
        ),
        status: vendorData.status,
        last_active:
          vendorData.status === "active"
            ? now
            : admin.firestore.Timestamp.fromDate(
                new Date(Date.now() - 24 * 60 * 60 * 1000)
              ), // active now, or 1 day ago if inactive
        phoneNumber: vendorData.phoneNumber || null,
        profileImageUrl: vendorData.profileImageUrl || null,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    } catch (error) {
      console.error(`Error seeding vendor ${vendorData.name}:`, error);
    }
  }
  console.log(`Successfully seeded ${count} vendors.`);
}

// --- User (Customer) Data and Seeding Function ---

const sampleUsers = [
  {
    displayName: "Andi Wijaya",
    email: "andi.wijaya@example.com",
    photoURL: "https://placehold.co/200x200/3F51B5/white?text=AW",
  },
  {
    displayName: "Bunga Citra",
    email: "bunga.citra@example.com",
    photoURL: "https://placehold.co/200x200/E91E63/white?text=BC",
  },
  {
    displayName: "Charlie Dharmawan",
    email: "charlie.d@example.com",
    photoURL: "https://placehold.co/200x200/009688/white?text=CD",
  },
  {
    displayName: "Dewi Lestari",
    email: "dewi.lestari@example.com",
    photoURL: "https://placehold.co/200x200/FFC107/black?text=DL",
  },
  {
    displayName: "Eko Prasetyo",
    email: "eko.p@example.com",
    photoURL: "https://placehold.co/200x200/673AB7/white?text=EP",
  },
];

async function seedUsers() {
  const usersCollection = db.collection("users");
  let count = 0;
  for (const userData of sampleUsers) {
    try {
      const now = admin.firestore.Timestamp.now();
      await usersCollection.add({
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL || null,
        createdAt: now,
        // lastLogin: now, // Optional: set lastLogin during seed
      });
      count++;
    } catch (error) {
      console.error(`Error seeding user ${userData.displayName}:`, error);
    }
  }
  console.log(`Successfully seeded ${count} users.`);
}

// --- Main Seeding Function ---

async function main() {
  console.log("Starting database seeding...");

  await seedVendors();
  await seedUsers();

  console.log("Database seeding completed.");
  // It's important to exit the process, otherwise it might hang
  process.exit(0);
}

main().catch((error) => {
  console.error("Unhandled error during seeding:", error);
  process.exit(1);
});
