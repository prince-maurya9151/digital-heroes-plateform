import { useEffect, useState } from 'react';
import api from '../../api/axios';

let cache = null;

export default function usePlans() {
  const [plans, setPlans] = useState(cache);
  useEffect(() => {
    if (cache) return;
    api.get('/subscription/plans').then((r) => { cache = r.data; setPlans(r.data); }).catch(() => {});
  }, []);
  return plans;
}
