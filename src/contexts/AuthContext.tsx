
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
    console.log("Setting up auth state listener");
    
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed", event, currentSession?.user?.id);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          if (currentSession?.user) {
            // Use setTimeout to avoid deadlocks with Supabase client
            setTimeout(() => {
              fetchUserProfile(currentSession.user.id);
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Got existing session", currentSession?.user?.id);
      setSession(currentSession);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle redirection when user state changes
  useEffect(() => {
    if (loading) return;
    
    const currentPath = window.location.pathname;
    console.log("User state changed, current path:", currentPath, "user:", user?.role);
    
    if (!user) {
      // If not authenticated and not already on auth pages, redirect to sign-in
      if (!currentPath.includes('sign-in') && !currentPath.includes('sign-up')) {
        navigate('/sign-in');
      }
      return;
    }

    // User is authenticated, handle redirects based on role and path
    if (user.role === "admin") {
      // Admin user
      if (currentPath.includes('sign-in') || currentPath.includes('sign-up') || currentPath === '/') {
        console.log("Redirecting admin to dashboard");
        navigate('/admin/dashboard');
      }
    } else if (user.role === "influencer") {
      // Influencer user
      if (!user.profileCompleted && !currentPath.includes('complete-profile')) {
        console.log("Redirecting to complete profile");
        navigate('/complete-profile');
      } else if (user.profileCompleted && (currentPath.includes('sign-in') || currentPath.includes('sign-up') || currentPath === '/')) {
        console.log("Redirecting influencer to dashboard");
        navigate('/influencer/dashboard');
      }
    }
  }, [user, loading, navigate]);

  // Fetch user profile data from the database
  const fetchUserProfile = async (authId: string) => {
    try {
      console.log("Fetching profile for auth ID:", authId);
      
      // Try to fetch admin profile
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (adminData) {
        console.log("Found admin profile:", adminData);
        setUser({
          id: authId,
          dbId: adminData.id,
          email: adminData.email,
          name: adminData.name,
          role: "admin"
        });
        setLoading(false);
        return;
      } else {
        console.log("No admin profile found, checking for influencer");
      }

      // Try to fetch influencer profile
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (influencerData) {
        console.log("Found influencer profile:", influencerData);
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
        setLoading(false);
        return;
      }

      // If no profile found
      console.error("No profile found for user:", authId);
      setUser(null);
      setLoading(false);
      
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("Attempting login with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log("Login successful for:", email);
      toast.success("Logged in successfully!");
      
      // Navigation will be handled by the auth state listener
      // We don't need to navigate here
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error?.message || "Failed to login");
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("Attempting signup with email:", email);
      
      // First check if this is the admin email
      if (email === "admin@dotfluence.com") {
        toast.error("This email is reserved for admin use");
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log("Signup successful for:", email);
      toast.success("Account created successfully!");
      
      // Navigation will be handled by the auth state listener
      // We don't need to navigate here
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error?.message || "Failed to create account");
      setLoading(false);
      throw error;
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
