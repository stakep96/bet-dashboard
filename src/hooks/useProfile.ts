import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  displayName: string;
  avatarUrl: string | null;
}

// Cache global para evitar re-fetch em navegação
let profileCache: Profile | null = null;
let cacheUserId: string | null = null;

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    displayName: profileCache?.displayName || '',
    avatarUrl: profileCache?.avatarUrl || null,
  });
  const [loading, setLoading] = useState(!profileCache || cacheUserId !== user?.id);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfile({ displayName: '', avatarUrl: null });
        profileCache = null;
        cacheUserId = null;
        return;
      }

      // Se já tem cache para este usuário, usa direto
      if (profileCache && cacheUserId === user.id) {
        setProfile(profileCache);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const newProfile = {
        displayName: data?.display_name || '',
        avatarUrl: data?.avatar_url || null,
      };
      
      profileCache = newProfile;
      cacheUserId = user.id;
      setProfile(newProfile);
      setLoading(false);
    };
    
    loadProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const dbUpdates: Record<string, unknown> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        user_id: user.id, 
        ...dbUpdates 
      }, { onConflict: 'user_id' });

    if (!error) {
      const newProfile = { ...profile, ...updates };
      profileCache = newProfile;
      setProfile(newProfile);
    }

    return { error };
  };

  const getInitials = (name: string) => {
    if (!name) return user?.email?.[0]?.toUpperCase() || 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    loading,
    updateProfile,
    getInitials: () => getInitials(profile.displayName),
  };
}