import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiRequest,
  clearAccessToken,
  clearSchoolContextId,
  getAccessToken,
  saveAccessToken,
  TOKEN_KEY
} from '../../api.js';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const sessionVersion = useRef(0);

  const signOut = useCallback(() => {
    sessionVersion.current += 1;
    clearAccessToken();
    clearSchoolContextId();
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      const token = getAccessToken();
      if (!token) return;
      const version = sessionVersion.current;
      try {
        const result = await apiRequest('/auth/me');
        if (!cancelled && sessionVersion.current === version && getAccessToken() === token) {
          setUser(result.data);
        }
      } catch {
        if (!cancelled && sessionVersion.current === version && getAccessToken() === token) signOut();
      }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, [signOut]);

  useEffect(() => {
    function synchronizeSession(event) {
      if (event.key !== TOKEN_KEY) return;
      sessionVersion.current += 1;
      if (!event.newValue) {
        clearSchoolContextId();
        setUser(null);
        return;
      }

      const token = event.newValue;
      clearSchoolContextId();
      const version = sessionVersion.current;
      apiRequest('/auth/me')
        .then((result) => {
          if (sessionVersion.current === version && getAccessToken() === token) {
            setUser(result.data);
          }
        })
        .catch(() => {
          if (sessionVersion.current === version && getAccessToken() === token) {
            clearAccessToken();
            setUser(null);
          }
        });
    }

    window.addEventListener('storage', synchronizeSession);
    return () => window.removeEventListener('storage', synchronizeSession);
  }, []);

  const acceptAuthenticatedSession = useCallback((session) => {
    saveAccessToken(session.accessToken);
    clearSchoolContextId();
    sessionVersion.current += 1;
    setUser(session.user);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser((current) => current?.id === updatedUser.id
      ? { ...current, ...updatedUser, school: updatedUser.school || current.school }
      : current);
  }, []);

  const signIn = useCallback(async (identifier, password) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    acceptAuthenticatedSession(result.data);
  }, [acceptAuthenticatedSession]);

  return { user, signIn, acceptAuthenticatedSession, signOut, updateUser };
}
