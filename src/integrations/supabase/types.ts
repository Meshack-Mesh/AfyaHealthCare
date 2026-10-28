export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      consent_records: {
        Row: {
          granted_at: string
          id: string
          purpose: string
          ussd_user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          granted_at?: string
          id?: string
          purpose: string
          ussd_user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          granted_at?: string
          id?: string
          purpose?: string
          ussd_user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_ussd_user_id_fkey"
            columns: ["ussd_user_id"]
            isOneToOne: false
            referencedRelation: "ussd_users"
            referencedColumns: ["id"]
          },
        ]
      }
      health_categories: {
        Row: {
          created_at: string
          id: string
          name_en: string
          name_sw: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name_en: string
          name_sw: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name_en?: string
          name_sw?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      health_content: {
        Row: {
          body_en: string
          body_sw: string
          category_id: string
          created_at: string
          id: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title_en: string
          title_sw: string
          updated_at: string
        }
        Insert: {
          body_en: string
          body_sw: string
          category_id: string
          created_at?: string
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_en: string
          title_sw: string
          updated_at?: string
        }
        Update: {
          body_en?: string
          body_sw?: string
          category_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_en?: string
          title_sw?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "health_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      healthcare_providers: {
        Row: {
          county: string
          created_at: string
          id: string
          location: string
          name: string
          phone: string
          services: string
          sort_order: number
        }
        Insert: {
          county: string
          created_at?: string
          id?: string
          location: string
          name: string
          phone: string
          services: string
          sort_order?: number
        }
        Update: {
          county?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          phone?: string
          services?: string
          sort_order?: number
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          status: Database["public"]["Enums"]["reminder_status"]
          ussd_user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          status?: Database["public"]["Enums"]["reminder_status"]
          ussd_user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          status?: Database["public"]["Enums"]["reminder_status"]
          ussd_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_ussd_user_id_fkey"
            columns: ["ussd_user_id"]
            isOneToOne: false
            referencedRelation: "ussd_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      ussd_sessions: {
        Row: {
          created_at: string
          id: string
          phone_number: string
          state: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          phone_number: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ussd_users: {
        Row: {
          consent_given: boolean
          created_at: string
          id: string
          language: Database["public"]["Enums"]["user_language"]
          phone_number: string
        }
        Insert: {
          consent_given?: boolean
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["user_language"]
          phone_number: string
        }
        Update: {
          consent_given?: boolean
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["user_language"]
          phone_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      content_status: "draft" | "reviewed" | "published"
      reminder_status: "pending" | "sent" | "cancelled"
      reminder_type: "immunization" | "clinic_visit"
      user_language: "en" | "sw"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      content_status: ["draft", "reviewed", "published"],
      reminder_status: ["pending", "sent", "cancelled"],
      reminder_type: ["immunization", "clinic_visit"],
      user_language: ["en", "sw"],
    },
  },
} as const
