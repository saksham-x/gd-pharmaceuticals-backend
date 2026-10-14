/**
 * Creates the first super admin, or promotes an existing account to super
 * admin and resets its password. Also creates the built-in roles if missing.
 *
 *   npm run create-admin -- <email> <password> [name]
 */
import { connectDB, disconnectDB } from '../config/db.js';
import { ensureSystemRoles } from '../modules/role/role.service.js';
import { SUPER_ADMIN_ROLE } from '../modules/role/role.types.js';
import { User } from '../modules/user/user.model.js';

async function main(): Promise<void> {
  const [rawEmail, password, name] = process.argv.slice(2);
  const email = rawEmail?.trim().toLowerCase();

  if (!email || !password) {
    console.error('Usage: npm run create-admin -- <email> <password> [name]');
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exitCode = 1;
    return;
  }

  await connectDB();
  try {
    await ensureSystemRoles();

    const existing = await User.findOne({ email }).select('+password');
    if (existing) {
      existing.role = SUPER_ADMIN_ROLE;
      existing.password = password;
      if (name) existing.name = name;
      await existing.save();
      console.log(`Promoted ${email} to super admin and reset the password.`);
    } else {
      await User.create({ email, password, name: name ?? email.split('@')[0], role: SUPER_ADMIN_ROLE });
      console.log(`Created super admin ${email}.`);
    }
  } finally {
    await disconnectDB();
  }
}

main().catch((err: unknown) => {
  console.error('create-admin failed:', err);
  process.exitCode = 1;
});
