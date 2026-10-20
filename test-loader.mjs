export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("https://")) {
    const mockContent = `
      export const initializeApp = () => ({});
      export const getApps = () => [];
      export const getApp = () => ({});
      export const getFirestore = () => ({});
      export const collection = () => ({});
      export const doc = () => ({});
      export const getDoc = async () => ({ exists: () => false, data: () => ({}) });
      export const getDocs = async () => ({ forEach: () => {}, docs: [] });
      export const setDoc = async () => {};
      export const addDoc = async () => ({ id: "mock_doc_" + Math.random().toString(36).substring(2) + Date.now().toString(36) });
      export const updateDoc = async () => {};
      export const deleteDoc = async () => {};
      export const query = () => ({});
      export const where = () => ({});
      export const orderBy = () => ({});
      export const limit = () => ({});
      export const onSnapshot = () => () => {};
      export const serverTimestamp = () => new Date().toISOString();
      export const Timestamp = {
        now: () => ({ toDate: () => new Date(), toMillis: () => Date.now(), seconds: Math.floor(Date.now() / 1000) }),
        fromDate: (d) => ({ toDate: () => d, toMillis: () => d.getTime(), seconds: Math.floor(d.getTime() / 1000) })
      };
      export const writeBatch = () => ({ set() {}, update() {}, commit: async () => {} });
      export const getAuth = () => ({});
      export const onAuthStateChanged = () => () => {};
      export const signInWithEmailAndPassword = async () => {};
      export const signOut = async () => {};
      export const createUserWithEmailAndPassword = async () => {};
      export const sendPasswordResetEmail = async () => {};
      export const updatePassword = async () => {};
      export const setPersistence = async () => {};
      export const browserLocalPersistence = {};
      export const browserSessionPersistence = {};
    `;
    return {
      url: "data:text/javascript," + encodeURIComponent(mockContent),
      shortCircuit: true,
      format: "module"
    };
  }
  return nextResolve(specifier, context);
}
