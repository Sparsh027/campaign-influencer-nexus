export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          auth_id: string | null
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          influencer_id: string
          status: Database["public"]["Enums"]["application_status"] | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          influencer_id: string
          status?: Database["public"]["Enums"]["application_status"] | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          influencer_id?: string
          status?: Database["public"]["Enums"]["application_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          categories: string[]
          city: string | null
          created_at: string
          description: string
          id: string
          min_followers: number | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          title: string
        }
        Insert: {
          categories: string[]
          city?: string | null
          created_at?: string
          description: string
          id?: string
          min_followers?: number | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          title: string
        }
        Update: {
          categories?: string[]
          city?: string | null
          created_at?: string
          description?: string
          id?: string
          min_followers?: number | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          title?: string
        }
        Relationships: []
      }
      influencers: {
        Row: {
          auth_id: string | null
          categories: string[] | null
          city: string | null
          created_at: string
          email: string
          follower_count: number | null
          id: string
          instagram: string | null
          name: string
          phone: string | null
          profile_completed: boolean | null
        }
        Insert: {
          auth_id?: string | null
          categories?: string[] | null
          city?: string | null
          created_at?: string
          email: string
          follower_count?: number | null
          id?: string
          instagram?: string | null
          name: string
          phone?: string | null
          profile_completed?: boolean | null
        }
        Update: {
          auth_id?: string | null
          categories?: string[] | null
          city?: string | null
          created_at?: string
          email?: string
          follower_count?: number | null
          id?: string
          instagram?: string | null
          name?: string
          phone?: string | null
          profile_completed?: boolean | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          receiver_id: string
          receiver_type: Database["public"]["Enums"]["user_type"]
          sender_id: string
          sender_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id: string
          receiver_type: Database["public"]["Enums"]["user_type"]
          sender_id: string
          sender_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id?: string
          receiver_type?: Database["public"]["Enums"]["user_type"]
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          target_id: string
          target_type: Database["public"]["Enums"]["user_type"]
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          target_id: string
          target_type: Database["public"]["Enums"]["user_type"]
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["user_type"]
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_id: {
        Args: { user_id: string }
        Returns: string
      }
      get_influencer_id: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      mark_message_as_read: {
        Args: { message_id: string }
        Returns: boolean
      }
    }
    Enums: {
      application_status: "pending" | "approved" | "rejected"
      campaign_status: "active" | "completed" | "draft"
      user_type: "admin" | "influencer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: ["pending", "approved", "rejected"],
      campaign_status: ["active", "completed", "draft"],
      user_type: ["admin", "influencer"],
    },
  },
} as const
