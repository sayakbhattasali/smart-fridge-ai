// ─── Utility Functions ────────────────────────────────────────────────────────
export const toBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => res(r.result as string);
    r.onerror = rej;
  });
