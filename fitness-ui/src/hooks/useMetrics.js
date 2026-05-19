import { useEffect, useState } from 'react';
import { getBodyMetrics } from '../api/metrics';

export const useMetrics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const refetch = async () => {
    setLoading(true);
    try { setData(await getBodyMetrics()); } finally { setLoading(false); }
  };
  useEffect(() => { refetch(); }, []);
  return { data, loading, refetch };
};
