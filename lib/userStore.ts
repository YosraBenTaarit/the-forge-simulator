/**
 * In-memory user store (temporary - for testing without database)
 * 
 * This uses a global Map to store users. Data resets on server restart.
 * When Prisma/database access is available, replace this with Prisma calls.
 * 
 * TODO: Migrate to Prisma + SQLite/PostgreSQL after corporate firewall allows downloads
 */

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string; // bcrypt hashed
  role: string;
}

let userStore: Map<string, StoredUser> | null = null;

export function getUserStore(): Map<string, StoredUser> {
  if (!userStore) {
    userStore = new Map();
    
    // Add demo user: demo@forge.dev / demo1234
    // Password hash for "demo1234" (bcryptjs with 10 rounds)
    const demoPasswordHash = "$2a$10$dXJ3SW6G7P50eS3sQ3yheu3CgJHMy.HmNbCNn2LZJOVEn7Bw4.p8q";
    
    userStore.set("demo@forge.dev", {
      id: "demo-user-1",
      email: "demo@forge.dev",
      name: "Demo User",
      password: demoPasswordHash,
      role: "none",
    });
  }
  
  return userStore;
}

export function resetUserStore(): void {
  userStore = null;
}
