import { useEffect, useState } from 'react';
import { getWorkouts } from '../api/workouts';

export const useWorkouts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const refetch = async () => {
    setLoading(true);
    try { setData(await getWorkouts()); } finally { setLoading(false); }
  };
  useEffect(() => { refetch(); }, []);
  return { data, loading, refetch };
};
