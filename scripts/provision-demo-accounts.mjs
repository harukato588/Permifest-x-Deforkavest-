import { createClient } from '@supabase/supabase-js';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEMO_ACCOUNTS = [
  {
    role: 'panitia',
    name: 'Panitia Demo',
    emailKey: 'DEMO_PANITIA_EMAIL',
    passwordKey: 'DEMO_PANITIA_PASSWORD',
  },
  {
    role: 'juri',
    name: 'Juri Demo',
    emailKey: 'DEMO_JURI_EMAIL',
    passwordKey: 'DEMO_JURI_PASSWORD',
  },
  {
    role: 'super_admin',
    name: 'Super Admin Demo',
    emailKey: 'DEMO_SUPER_ADMIN_EMAIL',
    passwordKey: 'DEMO_SUPER_ADMIN_PASSWORD',
  },
];

export function isLocalSupabaseUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'http:' &&
      ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) &&
      url.port === '54321' &&
      (url.pathname === '' || url.pathname === '/') &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

async function findAuthUserByEmail(supabase, email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Could not check existing demo users: ${error.message}`);

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
}

export async function ensureAuthUser(supabase, account) {
  const existingUser = await findAuthUserByEmail(supabase, account.email);
  const attributes = {
    password: account.password,
    email_confirm: true,
    user_metadata: {
      full_name: account.name,
      institution: '',
      phone: '',
    },
  };

  if (existingUser) {
    if (existingUser.app_metadata?.permifest_demo !== true) {
      throw new Error('Refusing to overwrite an existing account that is not marked as demo.');
    }

    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      ...attributes,
      app_metadata: existingUser.app_metadata,
    });
    if (error) throw new Error(`Could not update the ${account.role} demo account: ${error.message}`);
    return data.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    ...attributes,
    app_metadata: { permifest_demo: true },
  });
  if (error) throw new Error(`Could not create the ${account.role} demo account: ${error.message}`);
  return data.user.id;
}

async function assignDemoRole(supabase, account, userId) {
  const { error: profileError } = await supabase.from('users').upsert(
    {
      id: userId,
      full_name: account.name,
      email: account.email,
      institution: '',
      phone: '',
    },
    { onConflict: 'id' }
  );
  if (profileError) throw new Error(`Could not save the ${account.role} profile: ${profileError.message}`);

  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('key', account.role)
    .single();
  if (roleError) throw new Error(`Could not find the ${account.role} role: ${roleError.message}`);

  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);
  if (deleteError) throw new Error(`Could not reset the ${account.role} role: ${deleteError.message}`);

  const { error: insertError } = await supabase.from('user_roles').insert({
    user_id: userId,
    role_id: role.id,
    competition_id: null,
    granted_by: null,
  });
  if (insertError) throw new Error(`Could not assign the ${account.role} role: ${insertError.message}`);
}

export async function provisionDemoAccounts(env = process.env) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!isLocalSupabaseUrl(supabaseUrl)) {
    throw new Error('Demo provisioning only accepts the local Supabase API at 127.0.0.1:54321.');
  }

  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in the local environment.');
  }

  const accounts = DEMO_ACCOUNTS.map(({ emailKey, passwordKey, ...account }) => ({
    ...account,
    email: env[emailKey]?.trim().toLowerCase(),
    password: env[passwordKey],
  }));
  const missingVariables = DEMO_ACCOUNTS.flatMap(({ emailKey, passwordKey }, index) => {
    const missing = [];
    if (!accounts[index].email) missing.push(emailKey);
    if (!accounts[index].password) missing.push(passwordKey);
    return missing;
  });
  if (missingVariables.length) {
    throw new Error(`Missing local demo account variables: ${missingVariables.join(', ')}.`);
  }

  const demoEmails = accounts.map(({ email }) => email);
  if (new Set(demoEmails).size !== demoEmails.length) {
    throw new Error('Each demo role must use a unique email address.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const account of accounts) {
    const userId = await ensureAuthUser(supabase, account);
    await assignDemoRole(supabase, account, userId);
    process.stdout.write(`Provisioned local demo role: ${account.role}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  provisionDemoAccounts().catch((error) => {
    process.stderr.write(`Demo provisioning failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
