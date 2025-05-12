
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContextType, User, AdminUser, InfluencerUser } from "../types/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state and set up listener
  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile data from the database
  const fetchUserProfile = async (authId: string) => {
    try {
      // Try to fetch admin profile
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (adminData) {
        setUser({
          id: authId,
          dbId: adminData.id,
          email: adminData.email,
          name: adminData.name,
          role: "admin"
        });
        return;
      }

      // Try to fetch influencer profile
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (influencerData) {
        setUser({
          id: authId,
          dbId: influencerData.id,
          email: influencerData.email,
          name: influencerData.name,
          role: "influencer",
          instagram: influencerData.instagram || undefined,
          followerCount: influencerData.follower_count || undefined,
          phone: influencerData.phone || undefined,
          categories: influencerData.categories || undefined,
          city: influencerData.city || undefined,
          profileCompleted: influencerData.profile_completed
        });
        return;
      }

      // If no profile found
      console.error("No profile found for user:", authId);
      setUser(null);
      
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast.success("Logged in successfully!");
      
      // Navigation is handled by the auth state listener
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error?.message || "Failed to login");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      toast.success("Account created successfully! Please check your email to confirm your registration.");
      
      // Navigate to complete profile (navigation handled in auth state listener)
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error?.message || "Failed to create account");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      navigate("/sign-in");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out");
    }
  };

  const updateProfile = async (data: Partial<InfluencerUser>) => {
    if (!user) throw new Error("Not authenticated");
    
    try {
      if (user.role === "influencer") {
        const updateData = {
          name: data.name,
          instagram: data.instagram,
          follower_count: data.followerCount,
          phone: data.phone,
          categories: data.categories,
          city: data.city,
          profile_completed: data.profileCompleted !== undefined ? data.profileCompleted : user.profileCompleted
        };
        
        const { error } = await supabase
          .from('influencers')
          .update(updateData)
          .eq('id', user.dbId);
          
        if (error) throw error;
        
        // Update local state with new data
        setUser({
          ...user,
          ...data
        });
        
        toast.success("Profile updated successfully");
      } else {
        throw new Error("Only influencers can update their profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
