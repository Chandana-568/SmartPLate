// Minimal Firestore REST reader. Requests are made *as the signed-in caller*
// (their Firebase ID token), so firestore.rules still apply on the server and
// no service-account key is needed.

type Env = Record<string, string | undefined>
type FirestoreValue = Record<string, unknown>

function baseUrl(env: Env) {
  if (env.VITE_USE_EMULATORS === "true") {
    return "http://127.0.0.1:8080/v1/projects/demo-shareplate/databases/(default)/documents"
  }
  const project = env.FIREBASE_PROJECT_ID || "shareplate-a5bf2"
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`
}

// Firestore's typed JSON → plain JS values
function decode(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue
  if ("integerValue" in value) return Number(value.integerValue)
  if ("doubleValue" in value) return Number(value.doubleValue)
  if ("booleanValue" in value) return value.booleanValue
  if ("nullValue" in value) return null
  if ("timestampValue" in value) return value.timestampValue
  if ("arrayValue" in value) {
    const values = (value.arrayValue as { values?: FirestoreValue[] }).values ?? []
    return values.map(decode)
  }
  if ("mapValue" in value) {
    return decodeFields((value.mapValue as { fields?: Record<string, FirestoreValue> }).fields ?? {})
  }
  return undefined
}

function decodeFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decode(v)]))
}

export async function getDocument<T>(env: Env, idToken: string, path: string): Promise<(T & { id: string }) | null> {
  const response = await fetch(`${baseUrl(env)}/${path}`, {
    headers: { authorization: `Bearer ${idToken}` },
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Firestore read failed (${response.status})`)
  const doc = (await response.json()) as { name: string; fields?: Record<string, FirestoreValue> }
  return { ...(decodeFields(doc.fields ?? {}) as T), id: doc.name.split("/").pop() ?? "" }
}

// Equality query on one field, e.g. users where role == "ngo"
export async function queryEquals<T>(
  env: Env,
  idToken: string,
  collectionId: string,
  field: string,
  value: string,
  limit = 100
): Promise<(T & { id: string })[]> {
  const response = await fetch(`${baseUrl(env)}:runQuery`, {
    method: "POST",
    headers: { authorization: `Bearer ${idToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { stringValue: value } } },
        limit,
      },
    }),
  })
  if (!response.ok) throw new Error(`Firestore query failed (${response.status})`)
  const rows = (await response.json()) as { document?: { name: string; fields?: Record<string, FirestoreValue> } }[]
  return rows
    .filter((row) => row.document)
    .map((row) => ({
      ...(decodeFields(row.document!.fields ?? {}) as T),
      id: row.document!.name.split("/").pop() ?? "",
    }))
}
