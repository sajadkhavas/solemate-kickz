export type CustomerSession = {
  id: number;
  name: string;
  email: string;
  account_status: string;
  account_complete: boolean;
  phone_e164: string | null;
  phone_verified_at: string | null;
};

export type CustomerAddress = {
  id: number;
  label: string | null;
  recipient_name: string;
  phone_e164: string;
  country_code: string;
  province: string;
  city: string;
  postal_code: string | null;
  address_line1: string;
  address_line2: string | null;
  is_default: boolean;
};

export type ConsentRecord = {
  id: string;
  type: string;
  granted: boolean;
  policy_version: string;
  source: string;
  occurred_at: string;
};

type Envelope<T> = { data: T };

let csrfReady = false;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const error = new Error(`SOLE auth request failed with status ${response.status}`);
    Object.assign(error, { status: response.status });
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function ensureCsrf(): Promise<void> {
  if (csrfReady) return;
  await request<void>("csrf");
  csrfReady = true;
}

async function mutate<T>(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  await ensureCsrf();
  return request<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  try {
    const payload = await request<Envelope<CustomerSession>>("session");
    return payload.data;
  } catch (error) {
    if ((error as { status?: number }).status === 401) return null;
    throw error;
  }
}

export async function updateCustomerProfile(input: {
  name: string;
  phone: string;
  locale?: string | null;
}): Promise<CustomerSession> {
  const payload = await mutate<Envelope<{
    name: string;
    phone_e164: string;
    phone_verified_at: string | null;
    account_complete: boolean;
  }>>("customer", "PUT", input);
  const session = await getCustomerSession();
  if (!session) throw new Error("Session expired after profile update.");
  return { ...session, ...payload.data };
}

export async function getAddresses(): Promise<CustomerAddress[]> {
  return (await request<Envelope<CustomerAddress[]>>("customer/addresses")).data;
}

export async function saveAddress(input: {
  id?: number;
  label?: string | null;
  recipient_name: string;
  phone: string;
  country_code: string;
  province: string;
  city: string;
  postal_code?: string | null;
  address_line1: string;
  address_line2?: string | null;
  is_default: boolean;
}): Promise<CustomerAddress> {
  const { id, ...body } = input;
  return (
    await mutate<Envelope<CustomerAddress>>(
      id ? `customer/addresses/${id}` : "customer/addresses",
      id ? "PUT" : "POST",
      body,
    )
  ).data;
}

export async function deleteAddress(id: number): Promise<void> {
  await mutate<void>(`customer/addresses/${id}`, "DELETE");
}

export async function getConsents(): Promise<ConsentRecord[]> {
  return (await request<Envelope<ConsentRecord[]>>("customer/consents")).data;
}

export async function recordConsent(input: {
  type: "privacy" | "terms" | "marketing_email" | "marketing_sms" | "marketing_push";
  granted: boolean;
  policy_version: string;
}): Promise<ConsentRecord> {
  return (await mutate<Envelope<ConsentRecord>>("customer/consents", "POST", input)).data;
}

export async function requestAccountDeletion(): Promise<void> {
  await mutate("customer/deletion", "POST");
}

export async function cancelAccountDeletion(): Promise<void> {
  await mutate("customer/deletion", "DELETE");
}

export async function logoutCustomer(): Promise<void> {
  await mutate("logout", "POST");
  csrfReady = false;
}

export function accountExportUrl(): string {
  return "/api/auth/customer/export";
}
