import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ChangePasswordSchema,
  LoginSchema,
  NewPasswordSchema,
  ProfileSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from '../src/features/auth/schema.ts';
import {
  canAccessRoleArea,
  getDashboardPath,
  getPrimaryRole,
  requiresSuperAdminMfa,
} from '../src/lib/auth/roles.ts';
import {
  ensureAuthUser,
  isLocalSupabaseUrl,
  provisionDemoAccounts,
} from '../scripts/provision-demo-accounts.mjs';

test('new passwords require the minimum length and a number', () => {
  assert.equal(NewPasswordSchema.safeParse('abc12345').success, true);
  assert.equal(NewPasswordSchema.safeParse('12345678').success, true);
  assert.equal(NewPasswordSchema.safeParse('short1').success, false);
  assert.equal(NewPasswordSchema.safeParse('passwordonly').success, false);
  assert.equal(RegisterSchema.safeParse({
    fullName: 'Nama Peserta',
    email: 'peserta@example.com',
    password: 'abc12345',
    confirmPassword: 'abc12345',
  }).success, true);
  assert.equal(ResetPasswordSchema.safeParse({
    password: 'abc12345',
    confirmPassword: 'abc12345',
  }).success, true);
});

test('login accepts an existing password while password changes enforce the new policy', () => {
  assert.equal(LoginSchema.safeParse({ email: 'user@example.com', password: 'old' }).success, true);
  assert.equal(ChangePasswordSchema.safeParse({
    currentPassword: 'old12345',
    newPassword: 'new12345',
    confirmPassword: 'new12345',
  }).success, true);
  assert.equal(ChangePasswordSchema.safeParse({
    currentPassword: 'old12345',
    newPassword: 'old12345',
    confirmPassword: 'old12345',
  }).success, false);
});

test('profile validation keeps email and role outside client-editable profile fields', () => {
  const parsed = ProfileSchema.safeParse({
    fullName: 'Nama Pengguna',
    institution: 'Universitas',
    phone: '08123456789',
    email: 'someone@example.com',
    role: 'super_admin',
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal('email' in parsed.data, false);
    assert.equal('role' in parsed.data, false);
  }
  assert.equal(ProfileSchema.safeParse({
    fullName: 'A',
    institution: '',
    phone: '',
  }).success, false);
});

test('role routing uses the strongest assigned role and maps each dashboard', () => {
  assert.equal(getPrimaryRole(['peserta', 'juri']), 'juri');
  assert.equal(getPrimaryRole(['juri', 'panitia', 'super_admin']), 'super_admin');
  assert.equal(getPrimaryRole([]), null);
  assert.equal(canAccessRoleArea(['peserta'], ['panitia', 'super_admin']), false);
  assert.equal(canAccessRoleArea(['juri'], ['juri']), true);
  assert.equal(canAccessRoleArea(['juri'], ['peserta']), false);
  assert.equal(requiresSuperAdminMfa(['super_admin'], 'aal1'), false);
  assert.equal(requiresSuperAdminMfa(['super_admin'], 'aal2'), false);
  assert.equal(getDashboardPath('peserta'), '/dashboard/peserta');
  assert.equal(getDashboardPath('juri'), '/dashboard/juri');
  assert.equal(getDashboardPath('panitia'), '/dashboard/admin');
  assert.equal(getDashboardPath('super_admin'), '/dashboard/admin');
});

test('demo provisioning accepts only local Supabase API URLs', () => {
  assert.equal(isLocalSupabaseUrl('http://127.0.0.1:54321'), true);
  assert.equal(isLocalSupabaseUrl('http://localhost:54321/'), true);
  assert.equal(isLocalSupabaseUrl('http://[::1]:54321'), true);
  assert.equal(isLocalSupabaseUrl('http://user@localhost:54321'), false);
  assert.equal(isLocalSupabaseUrl('http://localhost:54321?target=remote'), false);
  assert.equal(isLocalSupabaseUrl('https://localhost:54321'), false);
  assert.equal(isLocalSupabaseUrl('http://localhost.evil.example:54321'), false);
  assert.equal(isLocalSupabaseUrl('https://project.supabase.co'), false);
  assert.equal(isLocalSupabaseUrl('http://127.0.0.1:8000'), false);
});

test('demo roles must use unique email addresses', async () => {
  await assert.rejects(
    provisionDemoAccounts({
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'local-test-key',
      DEMO_PANITIA_EMAIL: 'shared@example.test',
      DEMO_PANITIA_PASSWORD: 'local-only-password',
      DEMO_JURI_EMAIL: 'SHARED@example.test',
      DEMO_JURI_PASSWORD: 'local-only-password',
      DEMO_SUPER_ADMIN_EMAIL: 'admin@example.test',
      DEMO_SUPER_ADMIN_PASSWORD: 'local-only-password',
    }),
    /unique email address/
  );
});

test('demo provisioning refuses to overwrite an existing non-demo auth account', async () => {
  let updateCalled = false;
  const supabase = {
    auth: {
      admin: {
        listUsers: async () => ({
          data: { users: [{ id: 'existing-user', email: 'demo@example.test', app_metadata: {} }] },
          error: null,
        }),
        updateUserById: async () => {
          updateCalled = true;
          return { data: { user: { id: 'existing-user' } }, error: null };
        },
      },
    },
  };

  await assert.rejects(
    ensureAuthUser(supabase, {
      role: 'panitia',
      name: 'Panitia Demo',
      email: 'demo@example.test',
      password: 'local-only-password',
    }),
    /not marked as demo/
  );
  assert.equal(updateCalled, false);
});

test('demo provisioning marks new auth users and can refresh marked demo accounts', async () => {
  let createAttributes;
  const newUserClient = {
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: [] }, error: null }),
        createUser: async (attributes) => {
          createAttributes = attributes;
          return { data: { user: { id: 'new-demo-user' } }, error: null };
        },
      },
    },
  };
  const account = {
    role: 'panitia',
    name: 'Panitia Demo',
    email: 'demo@example.test',
    password: 'local-only-password',
  };

  assert.equal(await ensureAuthUser(newUserClient, account), 'new-demo-user');
  assert.equal(createAttributes.app_metadata.permifest_demo, true);

  let updateAttributes;
  const markedDemoClient = {
    auth: {
      admin: {
        listUsers: async () => ({
          data: {
            users: [{
              id: 'new-demo-user',
              email: account.email,
              app_metadata: { permifest_demo: true, source: 'local-seeder' },
            }],
          },
          error: null,
        }),
        updateUserById: async (_id, attributes) => {
          updateAttributes = attributes;
          return { data: { user: { id: 'new-demo-user' } }, error: null };
        },
      },
    },
  };

  assert.equal(await ensureAuthUser(markedDemoClient, account), 'new-demo-user');
  assert.deepEqual(updateAttributes.app_metadata, {
    permifest_demo: true,
    source: 'local-seeder',
  });
});
