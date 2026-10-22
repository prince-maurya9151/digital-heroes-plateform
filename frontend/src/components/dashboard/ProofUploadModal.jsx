import { useState } from 'react';
import api, { errMsg } from '../../api/axios';
import { Btn, Card, Msg } from '../common/ui';

const MAX_MB = 4; 
export default function ProofUploadModal({ winId, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const pick = (e) => {
    const f = e.target.files[0];
    setErr('');
    if (f && f.size > MAX_MB * 1024 * 1024) { setFile(null); return setErr(`Image must be smaller than ${MAX_MB} MB`); }
    setFile(f || null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setErr('');
    const fd = new FormData();
    fd.append('proof', file);
    try {
      await api.post(`/winners/${winId}/proof`, fd);
      onSuccess();
      onClose();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-ink border border-white/15 shadow-2xl">
        <h3 className="mb-2 text-lg font-semibold">Upload proof screenshot</h3>
        <p className="mb-4 text-sm text-white/60">Upload a screenshot of your scores from the golf platform for verification (JPG, PNG or WebP, max {MAX_MB} MB).</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={pick}
            className="block w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-brand/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/30 cursor-pointer"
          />
          <Msg>{err}</Msg>
          <div className="flex justify-end gap-2 pt-2">
            <Btn type="button" variant="ghost" onClick={onClose} disabled={busy}>Cancel</Btn>
            <Btn disabled={busy || !file}>{busy ? 'Uploading…' : 'Upload proof'}</Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
