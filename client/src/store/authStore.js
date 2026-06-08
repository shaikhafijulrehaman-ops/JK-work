import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { fetchWithRetry } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem('jk_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

const initialUser = getInitialUser();

export const useAuthStore = create((set, get) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  loading: false,
  error: null,
  otpSent: false,
  simulatedOtp: null,
  showLoginModal: false,
  setShowLoginModal: (show) => set({ showLoginModal: show }),

  // Check active session and refresh token
  checkSession: async () => {
    const isAlreadyAuthenticated = !!get().user;
    if (!isAlreadyAuthenticated) {
      set({ loading: true, error: null });
    } else {
      set({ error: null });
    }
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        try {
          const res = await fetch(`${API_URL}/auth/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email })
          });
          const data = await res.json();
          if (data.success) {
            localStorage.setItem('jk_user', JSON.stringify(data.user));
            if (data.token) {
              localStorage.setItem('jk_token', data.token);
            }
            set({ user: data.user, isAuthenticated: true, loading: false });
          } else {
            await supabase.auth.signOut();
            localStorage.removeItem('jk_user');
            localStorage.removeItem('jk_token');
            set({ user: null, isAuthenticated: false, error: data.message || 'Account not found. Please register first.', loading: false });
          }
        } catch (e) {
          const storedUser = localStorage.getItem('jk_user');
          if (storedUser) {
            set({ user: JSON.parse(storedUser), isAuthenticated: true, loading: false });
          } else {
            set({ user: null, isAuthenticated: false, loading: false });
          }
        }
      } else {
        const storedUser = localStorage.getItem('jk_user');
        if (storedUser) {
          set({ user: JSON.parse(storedUser), isAuthenticated: true, loading: false });
        } else {
          set({ user: null, isAuthenticated: false, loading: false });
        }
      }
    } catch (e) {
      const storedUser = localStorage.getItem('jk_user');
      if (storedUser) {
        set({ user: JSON.parse(storedUser), isAuthenticated: true, loading: false });
      } else {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    }
  },

  // Log in with Google OAuth
  loginWithGoogle: async () => {
    return new Promise((resolve) => {
      set({ loading: true, error: null });

      try {
        if (typeof google === 'undefined' || !google.accounts) {
          throw new Error('Google Sign-In library failed to load or is not loaded yet.');
        }

        const client = google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '754940661296-rgael0qg01dovmll4k65h8sicuif4stl.apps.googleusercontent.com',
          scope: 'email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                
                if (!userInfoRes.ok) {
                  throw new Error('Failed to retrieve user info from Google.');
                }
                
                const userInfo = await userInfoRes.json();
                const email = userInfo.email;

                const res = await fetch(`${API_URL}/auth/google-login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (data.success) {
                  localStorage.setItem('jk_user', JSON.stringify(data.user));
                  if (data.token) {
                    localStorage.setItem('jk_token', data.token);
                  }
                  set({ user: data.user, isAuthenticated: true, loading: false });
                  resolve({ success: true, user: data.user });
                } else {
                  set({ error: data.message, loading: false });
                  resolve({ success: false, error: data.message });
                }
              } catch (err) {
                console.error("Google verify error:", err);
                set({ error: err.message, loading: false });
                resolve({ success: false, error: err.message });
              }
            } else {
              set({ loading: false });
              resolve({ success: false, error: 'Google login failed.' });
            }
          },
          error_callback: (err) => {
            console.error("Google token error:", err);
            set({ error: err.message, loading: false });
            resolve({ success: false, error: err.message });
          }
        });

        client.requestAccessToken({ prompt: 'select_account' });
      } catch (e) {
        console.error('Google SDK error:', e);
        const errMsg = 'Google Sign-In is temporarily unavailable. Please login with Email OTP.';
        set({ error: errMsg, loading: false });
        resolve({ success: false, error: errMsg });
      }
    });
  },

  // Log in user / admin
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetchWithRetry(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
        timeout: 10000
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('jk_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('jk_token', data.token);
        }
        set({ user: data.user, isAuthenticated: true, loading: false });
        return { success: true, user: data.user };
      } else {
        set({ error: data.message, loading: false });
        return { success: false, error: data.message, approvalStatus: data.approvalStatus, workerName: data.workerName };
      }
    } catch (e) {
      console.error('[JK Auth Monitoring] Login failure:', e);
      const isTimeout = e.name === 'AbortError' || e.message?.toLowerCase().includes('timeout') || e.message?.toLowerCase().includes('abort');
      const errMessage = isTimeout 
        ? 'Login request timed out. Please try again shortly.' 
        : 'Connection problem or server error. Please check your connection and try again.';
      set({ error: errMessage, loading: false });
      return { success: false, error: errMessage };
    }
  },

  // Register User
  register: async (email, password, name, phone, role, partnerDetails = {}) => {
    set({ loading: true, error: null });
    try {
      console.log('AUTH RESPONSE: Initiating Supabase Auth Signup...');
      let { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, role }
        }
      });

      if (authError) {
        console.error('SUPABASE ERROR:', authError);
        throw authError;
      }
      
      console.log('AUTH RESPONSE: Supabase Auth Success:', authData);

      console.log('CUSTOMER INSERT RESPONSE: Syncing to backend...');
      const res = await fetchWithRetry(`${API_URL}/auth/sync-supabase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: authData.user?.id, 
          email, 
          password,
          name, 
          phone, 
          role, 
          ...partnerDetails 
        })
      });
      const dbData = await res.json();

      if (dbData.success) {
        console.log('CUSTOMER INSERT RESPONSE: Sync Success:', dbData);
        localStorage.setItem('jk_user', JSON.stringify(dbData.user));
        if (dbData.token) {
          localStorage.setItem('jk_token', dbData.token);
        }
        set({ user: dbData.user, isAuthenticated: true, loading: false });
        return { success: true, user: dbData.user };
      } else {
        console.error('CUSTOMER INSERT RESPONSE ERROR:', dbData.message);
        set({ error: dbData.message, loading: false });
        return { success: false, error: dbData.message };
      }
    } catch (e) {
      console.error('Registration error:', e);
      const errMessage = e.message || 'Unable to complete registration at this time. Please check your network and try again.';
      set({ error: errMessage, loading: false });
      return { success: false, error: errMessage };
    }
  },

  // Email OTP dispatch
  sendOtp: async (email) => {
    set({ loading: true, error: null });
    try {
      const res = await fetchWithRetry(`${API_URL}/auth/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        set({ otpSent: true, simulatedOtp: data.otp, loading: false });
        return true;
      }
      set({ loading: false, error: data.message || 'Failed to send OTP.' });
      return false;
    } catch (e) {
      console.error('Send OTP error:', e);
      set({ loading: false, error: 'Network error sending OTP. Please check your connection and try again.' });
      return false;
    }
  },

  // Verify Email OTP
  verifyOtp: async (email, code, isLogin = false) => {
    set({ loading: true, error: null });
    try {
      const res = await fetchWithRetry(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      set({ loading: false });

      if (data.success) {
        if (data.userExists) {
          localStorage.setItem('jk_user', JSON.stringify(data.user));
          if (data.token) {
            localStorage.setItem('jk_token', data.token);
          }
          set({ user: data.user, isAuthenticated: true, otpSent: false });
          return { success: true, userExists: true, user: data.user };
        } else {
          if (isLogin) {
            set({ error: 'No user registered with this email. Please sign up first.' });
            return { success: false, error: 'No user registered with this email. Please sign up first.' };
          }
          set({ otpSent: false });
          return { success: true, userExists: false };
        }
      } else {
        set({ error: data.message || 'Invalid verification code entered.' });
        return { success: false, error: data.message || 'Invalid code.' };
      }
    } catch (e) {
      console.error('Verify OTP error:', e);
      set({ error: 'Failed to verify verification code. Please check your network.', loading: false });
      return { success: false, error: 'Failed to verify OTP.' };
    }
  },

  // Join Waitlist
  joinWaitlist: async (name, mobile, email, selectedArea, pincode, location = null, latitude = null, longitude = null) => {
    set({ loading: true, error: null });
    try {
      const res = await fetchWithRetry(`${API_URL}/auth/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, email, selectedArea, pincode, location, latitude, longitude })
      });
      const data = await res.json();
      set({ loading: false });
      return data;
    } catch (e) {
      console.error('Join waitlist error:', e);
      set({ loading: false, error: 'Failed to join waitlist. Please check your connection.' });
      return { success: false, message: 'Failed to join waitlist.' };
    }
  },

  // Fetch Addresses
  fetchAddresses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetchWithRetry(`${API_URL}/addresses`, { method: 'GET' });
      const data = await res.json();
      set({ loading: false });
      if (data.success) {
        return data.data;
      }
      return [];
    } catch (e) {
      console.error('Fetch addresses error:', e);
      set({ loading: false, error: 'Failed to fetch addresses. Please check your connection.' });
      return [];
    }
  },

  // Add Address
  addAddress: async (addressData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetchWithRetry(`${API_URL}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });
      const data = await res.json();
      set({ loading: false });
      return data;
    } catch (e) {
      console.error('Add address error:', e);
      set({ loading: false, error: 'Failed to add address. Please check your connection.' });
      return { success: false, message: 'Failed to add address.' };
    }
  },

  // Edit Address
  editAddress: async (id, addressData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetchWithRetry(`${API_URL}/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });
      const data = await res.json();
      set({ loading: false });
      return data;
    } catch (e) {
      console.error('Edit address error:', e);
      set({ loading: false, error: 'Failed to edit address. Please check your connection.' });
      return { success: false, message: 'Failed to edit address.' };
    }
  },

  // Remove Address
  removeAddress: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetchWithRetry(`${API_URL}/addresses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      set({ loading: false });
      return data;
    } catch (e) {
      console.error('Remove address error:', e);
      set({ loading: false, error: 'Failed to delete address. Please check your connection.' });
      return { success: false, message: 'Failed to delete address.' };
    }
  },

  // Set Address Default
  setAddressDefault: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetchWithRetry(`${API_URL}/addresses/${id}/default`, { method: 'PUT' });
      const data = await res.json();
      set({ loading: false });
      return data;
    } catch (e) {
      console.error('Set default address error:', e);
      set({ loading: false, error: 'Failed to set default address. Please check your connection.' });
      return { success: false, message: 'Failed to set default address.' };
    }
  },

  // Clear Session
  logout: async () => {
    try {
      await fetchWithRetry(`${API_URL}/auth/logout`, { 
        method: 'GET',
        credentials: 'include'
      });
    } catch (e) {}
    localStorage.removeItem('jk_user');
    localStorage.removeItem('jk_cart');
    localStorage.removeItem('jk_addresses');
    localStorage.removeItem('jk_token');
    set({ user: null, isAuthenticated: false, otpSent: false });
  }
}));
