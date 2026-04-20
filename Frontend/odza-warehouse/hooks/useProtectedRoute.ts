'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/tokenAssistant';

export function useProtectedRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  return { isLoading };
}