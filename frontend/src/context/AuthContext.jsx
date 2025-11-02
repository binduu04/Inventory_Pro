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

// import { createContext, useContext, useState, useEffect } from 'react';
// import { supabase } from '../config/supabase';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [session, setSession] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Fetch full user profile
//   const fetchUserProfile = async (userId) => {
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('id, email, full_name, phone, role, created_at, updated_at')
//         .eq('id', userId)
//         .single();

//       if (error && error.code !== 'PGRST116') {
//         console.error('Profile fetch error:', error.message);
//         return null;
//       }
//       return data || null;
//     } catch (err) {
//       console.error('fetchUserProfile error:', err);
//       return null;
//     }
//   };

//   useEffect(() => {
//     let subscription;

//     const initAuth = async () => {
//       setLoading(true);
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();

//       setSession(session);

//       if (session?.user?.id) {
//         const profile = await fetchUserProfile(session.user.id);
//         setUser(profile || { ...session.user });
//       } else {
//         setUser(null);
//       }

//       setLoading(false);

//       // Listen for auth changes
//       const {
//         data: { subscription: sub },
//       } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
//         setSession(newSession);

//         if (newSession?.user?.id) {
//           const profile = await fetchUserProfile(newSession.user.id);
//           setUser(profile || { ...newSession.user });
//         } else {
//           setUser(null);
//         }

//         setLoading(false);
//       });

//       subscription = sub;
//     };

//     initAuth();

//     return () => {
//       subscription?.unsubscribe();
//     };
//   }, []);

//   // Auth actions
//   const signUp = async (email, password, fullName = '', phone = '', role = 'customer') => {
    
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: { data: { full_name: fullName, phone, role } },
//     });
//     return { data, error };
//   };

//   const signIn = async (email, password) => {
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });
//     return { data, error };
//   };

//   const signOut = async () => {
//     await supabase.auth.signOut();
//     setUser(null);
//     setSession(null);
//   };

//   const updateProfile = async (patch = {}) => {
//     if (!session?.user?.id) return { error: new Error('Not authenticated') };

//     const payload = { id: session.user.id, ...patch };
//     const { error } = await supabase.from('profiles').upsert(payload, { returning: 'representation' });
//     if (!error) {
//       const profile = await fetchUserProfile(session.user.id);
//       setUser(profile);
//     }
//     return { error };
//   };

//   const hasRole = (allowedRoles = []) => user && allowedRoles.includes(user.role);

//   const value = { user, session, loading, signUp, signIn, signOut, updateProfile, hasRole };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// }


// import { createContext, useContext, useState, useEffect } from 'react';
// import { supabase } from '../config/supabase';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [session, setSession] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Fetch full user profile from 'profiles' table
//   const fetchUserProfile = async (userId) => {
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('id, email, full_name, phone, role, created_at, updated_at')
//         .eq('id', userId)
//         .single();

//       if (error && error.code !== 'PGRST116') {
//         console.error('Profile fetch error:', error.message);
//         return null;
//       }
//       return data || null;
//     } catch (err) {
//       console.error('fetchUserProfile error:', err);
//       return null;
//     }
//   };

//   useEffect(() => {
//     let subscription;

//     const initAuth = async () => {
//       setLoading(true);

//       // Get current session
//       const { data } = await supabase.auth.getSession();
//       const currentSession = data?.session;
//       setSession(currentSession);

//       // If session exists, fetch user profile
//       if (currentSession?.user?.id) {
//         const profile = await fetchUserProfile(currentSession.user.id);
//         setUser(profile || { ...currentSession.user });
//       } else {
//         setUser(null);
//       }

//       setLoading(false);

//       // Listen for auth state changes
//       const {
//         data: { subscription: sub },
//       } = supabase.auth.onAuthStateChange(async (event, newSession) => {
//         console.log('Auth event:', event); // 👈 Helpful for debugging

//         setSession(newSession);

//         if (newSession?.user?.id) {
//           const profile = await fetchUserProfile(newSession.user.id);
//           setUser(profile || { ...newSession.user });
//         } else {
//           // On SIGNED_OUT or TOKEN_EXPIRED
//           setUser(null);
//           setSession(null);
//         }

//         setLoading(false);
//       });

//       subscription = sub;
//     };

//     initAuth();

//     return () => {
//       subscription?.unsubscribe();
//     };
//   }, []);

//   // ---------- AUTH ACTIONS ----------

//   const signUp = async (email, password, fullName = '', phone = '', role = 'customer') => {
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: { data: { full_name: fullName, phone, role } },
//     });
//     return { data, error };
//   };

//   const signIn = async (email, password) => {
//     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//     return { data, error };
//   };

//   // ✅ FIXED signOut (fully reliable)
//   const signOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     if (error) {
//       console.error('Sign-out error:', error.message);
//       return;
//     }

//     // Double-check Supabase actually cleared the session
//     const { data } = await supabase.auth.getSession();
//     if (!data.session) {
//       setUser(null);
//       setSession(null);
//     }
//   };

//   const updateProfile = async (patch = {}) => {
//     if (!session?.user?.id) return { error: new Error('Not authenticated') };

//     const payload = { id: session.user.id, ...patch };
//     const { error } = await supabase.from('profiles').upsert(payload, { returning: 'representation' });

//     if (!error) {
//       const profile = await fetchUserProfile(session.user.id);
//       setUser(profile);
//     }
//     return { error };
//   };

//   const hasRole = (allowedRoles = []) => user && allowedRoles.includes(user.role);

//   const value = {
//     user,
//     session,
//     loading,
//     signUp,
//     signIn,
//     signOut,
//     updateProfile,
//     hasRole,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// }


import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Track the last action to prevent unwanted re-authentication
  const lastActionRef = useRef(null);

  // Fetch full user profile from 'profiles' table
  const fetchUserProfile = useCallback(async (userId) => {
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
  }, []);

  // ✅ FIXED: Improved signOut with action tracking
  const signOut = useCallback(async () => {
    console.log('🚪 Sign out initiated');
    
    // Mark that we're signing out
    lastActionRef.current = 'SIGNING_OUT';
    
    // Clear state immediately
    setUser(null);
    setSession(null);
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Sign-out error:', error.message);
      lastActionRef.current = null;
      return { error };
    }

    console.log('✅ Sign out successful');
    
    // Keep the SIGNING_OUT flag for a bit longer to block any lingering events
    setTimeout(() => {
      lastActionRef.current = null;
      console.log('🔓 Ready for new sign in');
    }, 1000);
    
    return { error: null };
  }, []);

  useEffect(() => {
    let subscription;

    const initAuth = async () => {
      setLoading(true);

      // Get current session
      const { data } = await supabase.auth.getSession();
      const currentSession = data?.session;
      setSession(currentSession);

      // If session exists, fetch user profile
      if (currentSession?.user?.id) {
        const profile = await fetchUserProfile(currentSession.user.id);
        setUser(profile || { ...currentSession.user });
      } else {
        setUser(null);
      }

      setLoading(false);

      // Listen for auth state changes
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('🔐 Auth event:', event, 'lastAction:', lastActionRef.current);

        // CRITICAL: Block ALL events if we just signed out
        if (lastActionRef.current === 'SIGNING_OUT') {
          console.log('⛔ Blocking event - recently signed out:', event);
          return;
        }

        setSession(newSession);

        if (newSession?.user?.id) {
          // Mark that we're signing in
          lastActionRef.current = 'SIGNING_IN';
          
          const profile = await fetchUserProfile(newSession.user.id);
          setUser(profile || { ...newSession.user });
          console.log('✅ User signed in:', profile?.email || newSession.user.email);
          
          // Clear the action after successful sign in
          lastActionRef.current = null;
        } else {
          // Only clear state if we're not already signing out
          if (lastActionRef.current !== 'SIGNING_OUT') {
            setUser(null);
            setSession(null);
            console.log('❌ User signed out');
          }
        }

        setLoading(false);
      });

      subscription = sub;
    };

    initAuth();

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  // ---------- AUTH ACTIONS ----------

  const signUp = useCallback(async (email, password, fullName = '', phone = '', role = 'customer') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, role } },
    });
    return { data, error };
  }, []);

  const signIn = useCallback(async (email, password) => {
    // Clear any lingering sign out state
    lastActionRef.current = null;
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const updateProfile = useCallback(async (patch = {}) => {
    if (!session?.user?.id) return { error: new Error('Not authenticated') };

    const payload = { id: session.user.id, ...patch };
    const { error } = await supabase.from('profiles').upsert(payload, { returning: 'representation' });

    if (!error) {
      const profile = await fetchUserProfile(session.user.id);
      setUser(profile);
    }
    return { error };
  }, [session, fetchUserProfile]);

  const hasRole = useCallback((allowedRoles = []) => {
    return user && allowedRoles.includes(user.role);
  }, [user]);

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}