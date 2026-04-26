'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/tokenAssistant';
import { log } from 'console'; 
import { logout } from '@/lib/tokenAssistant';

export function useProtectedRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      router.replace('/login');
      return;
    }
      setIsLoading(false);
      

    // Set up exactly expiry timer to automatically log out user when token expires
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      if (tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        
        if (timeUntilExpiry <= 0) {
          // Token already expired, log out immediately
          console.log('⚠️ Expiration of Session detected, Logging out...');
          logout(true);
        } else {
          // Schedule logout at exact expiry time
          console.log(`Session will expire in ${Math.round(timeUntilExpiry / 1000)} seconds, setting up auto logout...`);
          const timer = setTimeout(() => {
            console.log('⚠️ Session expired, Logging out...');
            logout(true);
          }, timeUntilExpiry);


          // Clean up timer on unmount or user logs out manually
          return () => clearTimeout(timer);
        }
    }
  }, [router]);

  return { isLoading };
}
