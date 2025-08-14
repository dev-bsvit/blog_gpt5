import * as admin from 'firebase-admin';

function getServiceAccount(): admin.ServiceAccount | undefined {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json && json.trim()) {
    try {
      const data = JSON.parse(json);
      return {
        projectId: data.project_id,
        clientEmail: data.client_email,
        privateKey: (data.private_key as string)?.replace(/\\n/g, '\n'),
      } as admin.ServiceAccount;
    } catch {
      return undefined;
    }
  }
  try {
    const txt = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (txt && txt.trim()) {
      const data = JSON.parse(txt);
      return {
        projectId: data.project_id,
        clientEmail: data.client_email,
        privateKey: (data.private_key as string)?.replace(/\\n/g, '\n'),
      } as admin.ServiceAccount;
    }
  } catch {}
  return undefined;
}

export function getAdminApp(): admin.app.App {
  if (admin.apps.length) return admin.app();
  const sa = getServiceAccount();
  if (sa) {
    return admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  return admin.initializeApp();
}

export function getFirestore(): admin.firestore.Firestore {
  const app = getAdminApp();
  return admin.firestore(app);
}

export function getAuth(): admin.auth.Auth {
  const app = getAdminApp();
  return admin.auth(app);
}


