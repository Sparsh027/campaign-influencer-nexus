
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContextType, User } from "../types/auth";
import { toast } from "sonner";

// Mock admin account
const ADMIN_USER: User = {
  id: "admin-1",
  email: "admin@dotfluence.com",
  name: "Admin User",
  role: "admin"
};

// Mock data storage - in a real app, this would be stored in a database
const MOCK_USERS: Record<string, User> = {
  "admin@dotfluence.com": ADMIN_USER
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("dotfluence-user");
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("dotfluence-user");
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const lowercaseEmail = email.toLowerCase();
      const mockUser = MOCK_USERS[lowercaseEmail];
      
      if (!mockUser) {
        // For demo, auto-create influencer users that don't exist
        if (email !== "admin@dotfluence.com") {
          const newUser: User = {
            id: `influencer-${Date.now()}`,
            email: lowercaseEmail,
            name: email.split("@")[0],
            role: "influencer",
            profileCompleted: false
          };
          MOCK_USERS[lowercaseEmail] = newUser;
          setUser(newUser);
          localStorage.setItem("dotfluence-user", JSON.stringify(newUser));
          toast.success("Logged in successfully!");
          
          // Navigate to profile completion for new influencers
          navigate("/complete-profile");
          return;
        }
        throw new Error("Invalid credentials");
      }

      // Only allow admin login for admin@dotfluence.com
      if (lowercaseEmail === "admin@dotfluence.com") {
        if (password !== "adminpassword") {
          throw new Error("Invalid admin password");
        }
      }

      setUser(mockUser);
      localStorage.setItem("dotfluence-user", JSON.stringify(mockUser));
      toast.success("Logged in successfully!");
      
      // Navigate based on user role
      if (mockUser.role === "admin") {
        navigate("/admin/dashboard");
      } else if (mockUser.role === "influencer") {
        if (!mockUser.profileCompleted) {
          navigate("/complete-profile");
        } else {
          navigate("/influencer/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to login");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock signup delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const lowercaseEmail = email.toLowerCase();
      
      // Don't allow admin signup
      if (lowercaseEmail === "admin@dotfluence.com") {
        throw new Error("This email is reserved. Please use a different email.");
      }
      
      // Check if user already exists
      if (MOCK_USERS[lowercaseEmail]) {
        throw new Error("User already exists");
      }
      
      // Create new influencer user
      const newUser: User = {
        id: `influencer-${Date.now()}`,
        email: lowercaseEmail,
        name: email.split("@")[0],
        role: "influencer",
        profileCompleted: false
      };
      
      MOCK_USERS[lowercaseEmail] = newUser;
      setUser(newUser);
      localStorage.setItem("dotfluence-user", JSON.stringify(newUser));
      toast.success("Account created successfully!");
      
      // Navigate to profile completion
      navigate("/complete-profile");
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create account");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("dotfluence-user");
    navigate("/sign-in");
    toast.success("Logged out successfully");
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) throw new Error("Not authenticated");
    
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedUser = { ...user, ...data };
    MOCK_USERS[user.email] = updatedUser;
    setUser(updatedUser);
    localStorage.setItem("dotfluence-user", JSON.stringify(updatedUser));
    
    return;
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
