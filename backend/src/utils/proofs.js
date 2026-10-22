import { supabase } from '../config/supabase.js';
export async function signProofs(rows) {
  const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
  await Promise.all(
    list.map(async (w) => {
      if (!w.proof_url || /^https?:\/\//.test(w.proof_url)) return; // legacy public URLs left as-is
      const { data } = await supabase.storage.from('proofs').createSignedUrl(w.proof_url, 3600);
      w.proof_url = data?.signedUrl || null;
    })
  );
  return rows;
}
