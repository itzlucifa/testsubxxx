import { supabase } from './supabase';
import type { User } from '../types';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  username: string;
}

export const authService = {
  async signUp(data: SignUpData) {
    if (!supabase) throw new Error('Supabase is not configured');
    
    console.log('🔐 Auth: Starting Supabase signup for:', data.email);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    console.log('🔐 Auth: Supabase auth.signUp response:', { authData, authError });

    if (authError) {
      console.error('❌ Auth: Supabase auth error:', authError);
      throw authError;
    }
    if (!authData.user) {
      console.error('❌ Auth: No user returned from Supabase');
      throw new Error('Failed to create user');
    }

    console.log('✅ Auth: User created in Supabase auth, attempting profile creation...');

    // Try to create user profile - if it fails due to rate limiting, that's OK
    // The user is still created in Supabase auth
    try {
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        username: data.username,
        email: data.email,
        role: 'user',
        subscription: 'free',
        mfa_enabled: false,
        last_login: new Date().toISOString(),
      });

      if (profileError) {
        console.warn('⚠️ Auth: Profile creation error (this may be due to email rate limits):', profileError);
        // Don't throw error here - the user is still created in auth system
        // Profile will be created by the trigger eventually
      } else {
        console.log('✅ Auth: Profile created successfully');
      }
    } catch (profileErr) {
      console.warn('⚠️ Auth: Profile creation failed (may be due to rate limits), continuing...', profileErr);
    }

    // Try to create security settings
    try {
      const { error: settingsError } = await supabase.from('security_settings').insert({
        user_id: authData.user.id,
        auto_remediation: true,
        deepfake_detection: true,
        post_quantum_crypto: true,
        language: 'en',
        email_notifications: true,
        whatsapp_notifications: false,
        sms_notifications: false,
        push_notifications: true,
        zero_trust_enabled: true,
        continuous_auth: true,
        micro_segmentation: false,
      });

      if (settingsError) {
        console.warn('⚠️ Auth: Settings creation error (non-critical):', settingsError);
      } else {
        console.log('✅ Auth: Security settings created');
      }
    } catch (settingsErr) {
      console.warn('⚠️ Auth: Settings creation failed (non-critical)', settingsErr);
    }

    console.log('✅ Auth: Signup complete!');
    return authData;
  },

  async signIn(credentials: AuthCredentials) {
    if (!supabase) throw new Error('Supabase is not configured');
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    
    if (error) throw error;
    if (!data.user) throw new Error('Failed to sign in');

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    return data;
  },

  async signOut() {
    if (!supabase) throw new Error('Supabase is not configured');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    console.log('🔍 Auth: Getting current user...');
    
    if (!supabase) {
      console.log('⚠️ Auth: Supabase not configured, returning demo user');
      // Demo mode - return a demo user when Supabase is not configured
      return {
        id: 'demo-user-123',
        username: 'Demo User',
        email: 'demo@cybershield.com',
        role: 'admin',
        subscription: 'enterprise',
        mfaEnabled: false,
        createdAt: new Date(),
        lastLogin: new Date(),
      };
    }
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      role: profile.role,
      subscription: profile.subscription,
      mfaEnabled: profile.mfa_enabled,
      createdAt: new Date(profile.created_at),
      lastLogin: new Date(profile.last_login),
    };
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    // Check localStorage user immediately
    this.getCurrentUser().then(callback);

    // Listen for localStorage changes (for demo login)
    const handleStorageChange = () => {
      this.getCurrentUser().then(callback);
    };
    window.addEventListener('storage', handleStorageChange);
    
    if (!supabase) {
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              window.removeEventListener('storage', handleStorageChange);
            } 
          } 
        } 
      };
    }
    
    const authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            window.removeEventListener('storage', handleStorageChange);
            authSubscription.data.subscription.unsubscribe();
          }
        }
      }
    };
  },
};
