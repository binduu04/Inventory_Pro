// import { createContext, useContext, useState, useEffect } from 'react';
// import { supabase } from '../config/supabase';

// const AuthContext = createContext(null);

// function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within an AuthProvider');
//   return context;
// }

// function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [session, setSession] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // --- Fetch user profile ---
//   const fetchUserProfile = async (userId) => {
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('id, email, full_name, phone, role, created_at, updated_at')
//         .eq('id', userId)
//         .single();

//       if (error) {
//         setUser(null);
//         return;
//       }

//       setUser(data);
//     } catch (err) {
//       console.error('fetchUserProfile error:', err);
//       setUser(null);
//     }
//   };

//   // --- Init + auth listener ---
//   useEffect(() => {
//     let sub = null;

//     (async () => {
//       try {
//         const { data: { session: s } } = await supabase.auth.getSession();
//         setSession(s);
//         if (s?.user?.id) await fetchUserProfile(s.user.id);
//       } catch (err) {
//         console.error('Auth init error:', err);
//       } finally {
//         setLoading(false);
//       }
//     })();

//     const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
//       setSession(newSession);
//       if (newSession?.user?.id) {
//         await fetchUserProfile(newSession.user.id);
//       } else {
//         setUser(null);
//       }
//     });

//     sub = data?.subscription;
//     return () => sub?.unsubscribe?.();
//   }, []);

//   // --- Auth actions ---
//   const signUp = async (email, password, fullName = '', phone = '', role = 'customer') => {
//     try {
//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: { data: { full_name: fullName, phone, role } },
//       });
//       if (error) throw error;
//       return { data, error: null };
//     } catch (err) {
//       return { data: null, error: err };
//     }
//   };

//   const signIn = async (email, password) => {
//     try {
//       const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//       if (error) throw error;
//       return { data, error: null };
//     } catch (err) {
//       return { data: null, error: err };
//     }
//   };

//   const signOut = async () => {
//     try {
//       const { error } = await supabase.auth.signOut();
//       if (error) throw error;
//       setUser(null);
//       setSession(null);
//     } catch (err) {
//       console.error('signOut error:', err);
//     }
//   };

//   const updateProfile = async (patch = {}) => {
//     if (!session?.user?.id) return { error: new Error('Not authenticated') };
//     try {
//       const { role, ...safePatch } = patch;
//       const payload = { id: session.user.id, ...safePatch };
//       const { error } = await supabase.from('profiles').upsert(payload, { returning: 'representation' });
//       if (error) throw error;
//       await fetchUserProfile(session.user.id);
//       return { error: null };
//     } catch (err) {
//       console.error('updateProfile error:', err);
//       return { error: err };
//     }
//   };

//   const hasRole = (allowedRoles = []) => user && allowedRoles.includes(user.role);

//   const value = { user, session, loading, signUp, signIn, signOut, updateProfile, hasRole };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export { useAuth, AuthProvider };

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch full user profile
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, role, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error.message);
        return null;
      }
      return data || null;
    } catch (err) {
      console.error('fetchUserProfile error:', err);
      return null;
    }
  };

  useEffect(() => {
    let subscription;

    const initAuth = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user?.id) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile || { ...session.user });
      } else {
        setUser(null);
      }

      setLoading(false);

      // Listen for auth changes
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);

        if (newSession?.user?.id) {
          const profile = await fetchUserProfile(newSession.user.id);
          setUser(profile || { ...newSession.user });
        } else {
          setUser(null);
        }

        setLoading(false);
      });

      subscription = sub;
    };

    initAuth();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Auth actions
  const signUp = async (email, password, fullName = '', phone = '', role = 'customer') => {
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, role } },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (patch = {}) => {
    if (!session?.user?.id) return { error: new Error('Not authenticated') };

    const payload = { id: session.user.id, ...patch };
    const { error } = await supabase.from('profiles').upsert(payload, { returning: 'representation' });
    if (!error) {
      const profile = await fetchUserProfile(session.user.id);
      setUser(profile);
    }
    return { error };
  };

  const hasRole = (allowedRoles = []) => user && allowedRoles.includes(user.role);

  const value = { user, session, loading, signUp, signIn, signOut, updateProfile, hasRole };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


