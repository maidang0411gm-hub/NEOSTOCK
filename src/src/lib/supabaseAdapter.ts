import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

type ProviderInfo = {
  providerId: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: ProviderInfo[];
};

type QueryConstraint =
  | { kind: 'where'; field: string; op: '=='; value: unknown }
  | { kind: 'orderBy'; field: string; direction: 'asc' | 'desc' };

type CollectionRef = {
  kind: 'collection';
  table: string;
};

type DocumentRef = {
  kind: 'document';
  table: string;
  id: string;
};

type QueryRef = {
  kind: 'query';
  table: string;
  constraints: QueryConstraint[];
};

type SnapshotDoc<T = any> = {
  id: string;
  data: () => T;
};

type Snapshot<T = any> = {
  docs: SnapshotDoc<T>[];
};

const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const ENV_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const PRODUCTS_COLUMNS = new Set([
  'id',
  'user_id',
  'sku',
  'name',
  'category',
  'variant',
  'quantity',
  'min_stock',
  'recommended_stock',
  'price',
  'cost_price',
  'image_url',
  'note',
  'last_updated',
  'sort_order',
  'is_header',
]);

const TRANSACTIONS_COLUMNS = new Set([
  'id',
  'user_id',
  'product_id',
  'product_sku',
  'product_name',
  'product_image_url',
  'type',
  'quantity',
  'timestamp',
  'note',
  'order_number',
  'order_source',
  'shipping_code',
  'price',
  'total_price',
  'payment_method',
  'batch_id',
  'batch_name',
]);

const db = { kind: 'db' } as const;
const auth = {
  get currentUser() {
    return currentUser;
  },
};
const storage = { bucket: 'products' } as const;

let currentUser: User | null = null;
let cachedConfigKey = '';
let cachedClient: SupabaseClient | null = null;

function readStoredConfig() {
  if (typeof window === 'undefined') {
    return { url: ENV_SUPABASE_URL, key: ENV_SUPABASE_KEY };
  }

  const raw = window.localStorage.getItem('neostock_supabase_config');
  if (!raw) {
    return { url: ENV_SUPABASE_URL, key: ENV_SUPABASE_KEY };
  }

  try {
    const parsed = JSON.parse(raw);
    const useStored = parsed?.enabled && parsed?.url && parsed?.key;
    return {
      url: useStored ? parsed.url : ENV_SUPABASE_URL,
      key: useStored ? parsed.key : ENV_SUPABASE_KEY,
    };
  } catch {
    return { url: ENV_SUPABASE_URL, key: ENV_SUPABASE_KEY };
  }
}

function getClient() {
  const { url, key } = readStoredConfig();
  const configKey = `${url}|${key}`;

  if (!url || !key) {
    throw new Error('Supabase chưa được cấu hình. Hãy kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  }

  if (!cachedClient || cachedConfigKey !== configKey) {
    cachedConfigKey = configKey;
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: window.fetch.bind(window),
      },
    });
  }

  return cachedClient;
}

function normalizeUser(sessionUser: Session['user'] | null): User | null {
  if (!sessionUser) return null;

  const provider = sessionUser.app_metadata?.provider ?? 'email';
  return {
    uid: sessionUser.id,
    email: sessionUser.email ?? null,
    displayName: sessionUser.user_metadata?.display_name ?? sessionUser.user_metadata?.name ?? null,
    photoURL: sessionUser.user_metadata?.avatar_url ?? null,
    emailVerified: !!sessionUser.email_confirmed_at,
    isAnonymous: provider === 'anonymous',
    tenantId: null,
    providerData: [
      {
        providerId: provider,
        displayName: sessionUser.user_metadata?.display_name ?? sessionUser.user_metadata?.name ?? null,
        email: sessionUser.email ?? null,
        photoURL: sessionUser.user_metadata?.avatar_url ?? null,
      },
    ],
  };
}

function toSnakeCase(field: string) {
  return field.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);
}

function toCamelCase(field: string) {
  return field.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function mapRowToApp<T extends Record<string, any>>(row: T | null) {
  if (!row) return row;
  const next: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    next[toCamelCase(key)] = value;
  }

  return next;
}

function sanitizePayload(table: string, data: Record<string, any>) {
  const allowedColumns = table === 'products' ? PRODUCTS_COLUMNS : TRANSACTIONS_COLUMNS;
  const next: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    const snakeKey = toSnakeCase(key);
    if (!allowedColumns.has(snakeKey)) continue;

    next[snakeKey] = value;
  }

  return next;
}

function buildSelectQuery(table: string, constraints: QueryConstraint[]) {
  let builder: any = getClient().from(table).select('*');

  for (const constraint of constraints) {
    if (constraint.kind === 'where' && constraint.op === '==') {
      builder = builder.eq(toSnakeCase(constraint.field), constraint.value);
    }

    if (constraint.kind === 'orderBy') {
      builder = builder.order(toSnakeCase(constraint.field), { ascending: constraint.direction !== 'desc' });
    }
  }

  return builder;
}

async function loadSnapshot(queryRef: QueryRef) {
  const { data, error } = await buildSelectQuery(queryRef.table, queryRef.constraints);

  if (error) throw error;

  const docs = (data ?? []).map((row: any) => {
    const mapped = mapRowToApp(row);
    return {
      id: row.id,
      data: () => mapped,
    };
  });

  return { docs } satisfies Snapshot;
}

async function executeBatchOp(op: { type: string; ref: DocumentRef; data?: Record<string, any> }) {
  if (op.type === 'delete') {
    const { error } = await getClient().from(op.ref.table).delete().eq('id', op.ref.id);
    if (error) throw error;
    return;
  }

  if (op.type === 'update') {
    const payload = sanitizePayload(op.ref.table, op.data ?? {});
    const { error } = await getClient().from(op.ref.table).update(payload).eq('id', op.ref.id);
    if (error) throw error;
    return;
  }

  if (op.type === 'set') {
    const payload = sanitizePayload(op.ref.table, { ...(op.data ?? {}), id: op.ref.id });
    const { error } = await getClient().from(op.ref.table).upsert(payload);
    if (error) throw error;
  }
}

export { auth, db, storage };

export async function signInWithEmailAndPassword(_: typeof auth, email: string, password: string) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  currentUser = normalizeUser(data.user);
  return { user: currentUser };
}

export async function createUserWithEmailAndPassword(_: typeof auth, email: string, password: string) {
  const { data, error } = await getClient().auth.signUp({ email, password });
  if (error) throw error;
  currentUser = normalizeUser(data.user);
  return { user: currentUser };
}

export function onAuthStateChanged(_: typeof auth, callback: (user: User | null) => void) {
  getClient().auth.getSession().then(({ data }) => {
    currentUser = normalizeUser(data.session?.user ?? null);
    callback(currentUser);
  });

  const {
    data: { subscription },
  } = getClient().auth.onAuthStateChange((_event, session) => {
    currentUser = normalizeUser(session?.user ?? null);
    callback(currentUser);
  });

  return () => subscription.unsubscribe();
}

export async function signOut(_: typeof auth) {
  const { error } = await getClient().auth.signOut();
  if (error) throw error;
  currentUser = null;
}

export async function updateProfile(user: User, updates: { displayName?: string | null }) {
  const { error } = await getClient().auth.updateUser({
    data: {
      display_name: updates.displayName ?? null,
    },
  });

  if (error) throw error;

  user.displayName = updates.displayName ?? null;
  currentUser = { ...user };
}

export function collection(_: typeof db, table: string): CollectionRef {
  return { kind: 'collection', table };
}

export function where(field: string, op: '==', value: unknown): QueryConstraint {
  return { kind: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { kind: 'orderBy', field, direction };
}

export function query(collectionRef: CollectionRef, ...constraints: QueryConstraint[]): QueryRef {
  return { kind: 'query', table: collectionRef.table, constraints };
}

export function doc(target: typeof db | CollectionRef, table?: string, id?: string): DocumentRef {
  if ((target as CollectionRef).kind === 'collection') {
    return {
      kind: 'document',
      table: (target as CollectionRef).table,
      id: table ?? crypto.randomUUID(),
    };
  }

  return {
    kind: 'document',
    table: table!,
    id: id!,
  };
}

export async function getDocFromServer(documentRef: DocumentRef) {
  const { data, error } = await getClient().from(documentRef.table).select('*').eq('id', documentRef.id).maybeSingle();
  if (error) throw error;
  return {
    exists: () => !!data,
    data: () => mapRowToApp(data),
  };
}

export function onSnapshot(queryRef: QueryRef, next: (snapshot: Snapshot) => void, onError?: (error: unknown) => void) {
  let isClosed = false;

  const refresh = async () => {
    try {
      const snapshot = await loadSnapshot(queryRef);
      if (!isClosed) next(snapshot);
    } catch (error) {
      if (!isClosed) onError?.(error);
    }
  };

  refresh();

  const userFilter = queryRef.constraints.find(
    constraint => constraint.kind === 'where' && constraint.field === 'userId' && constraint.op === '==',
  ) as Extract<QueryConstraint, { kind: 'where' }> | undefined;

  const channel = getClient()
    .channel(`neostock-${queryRef.table}-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: queryRef.table,
        filter: userFilter ? `user_id=eq.${userFilter.value}` : undefined,
      },
      () => {
        refresh();
      },
    )
    .subscribe();

  return () => {
    isClosed = true;
    getClient().removeChannel(channel);
  };
}

export async function addDoc(collectionRef: CollectionRef, data: Record<string, any>) {
  const payload = sanitizePayload(collectionRef.table, data);
  const { data: inserted, error } = await getClient()
    .from(collectionRef.table)
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return { id: inserted.id, data: () => mapRowToApp(inserted) };
}

export async function updateDoc(documentRef: DocumentRef, data: Record<string, any>) {
  const payload = sanitizePayload(documentRef.table, data);
  const { error } = await getClient().from(documentRef.table).update(payload).eq('id', documentRef.id);
  if (error) throw error;
}

export async function deleteDoc(documentRef: DocumentRef) {
  const { error } = await getClient().from(documentRef.table).delete().eq('id', documentRef.id);
  if (error) throw error;
}

export async function setDoc(documentRef: DocumentRef, data: Record<string, any>) {
  const payload = sanitizePayload(documentRef.table, { ...data, id: documentRef.id });
  const { error } = await getClient().from(documentRef.table).upsert(payload);
  if (error) throw error;
}

export function writeBatch(_: typeof db) {
  const ops: { type: string; ref: DocumentRef; data?: Record<string, any> }[] = [];

  return {
    delete(ref: DocumentRef) {
      ops.push({ type: 'delete', ref });
    },
    update(ref: DocumentRef, data: Record<string, any>) {
      ops.push({ type: 'update', ref, data });
    },
    set(ref: DocumentRef, data: Record<string, any>) {
      ops.push({ type: 'set', ref, data });
    },
    async commit() {
      for (const op of ops) {
        await executeBatchOp(op);
      }
    },
  };
}

export const Timestamp = {
  now: () => new Date(),
};

export function ref(_: typeof storage, path: string) {
  return { bucket: storage.bucket, path };
}

export async function uploadBytes(storageRef: { bucket: string; path: string }, file: File) {
  const { error } = await getClient().storage.from(storageRef.bucket).upload(storageRef.path, file, {
    upsert: true,
  });

  if (error) throw error;
}

export async function getDownloadURL(storageRef: { bucket: string; path: string }) {
  const { data } = getClient().storage.from(storageRef.bucket).getPublicUrl(storageRef.path);
  return data.publicUrl;
}
