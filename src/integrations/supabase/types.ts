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
      activity_logs: {
        Row: {
          created_at: string | null
          date: string
          details: string | null
          id: number
          room_id: number
          room_name: string
          status: string
          time: string
          user_id: number | null
          user_name: string
        }
        Insert: {
          created_at?: string | null
          date: string
          details?: string | null
          id?: number
          room_id: number
          room_name: string
          status: string
          time: string
          user_id?: number | null
          user_name: string
        }
        Update: {
          created_at?: string | null
          date?: string
          details?: string | null
          id?: number
          room_id?: number
          room_name?: string
          status?: string
          time?: string
          user_id?: number | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      room_power_data: {
        Row: {
          current_draw: number
          device_id: string | null
          id: string
          recorded_at: string
          room_id: number
        }
        Insert: {
          current_draw: number
          device_id?: string | null
          id?: string
          recorded_at?: string
          room_id: number
        }
        Update: {
          current_draw?: number
          device_id?: string | null
          id?: string
          recorded_at?: string
          room_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_power_data_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_status: {
        Row: {
          created_at: string | null
          current_draw: number | null
          id: number
          last_updated: string | null
          room_id: number
          room_name: string
          status: string
        }
        Insert: {
          created_at?: string | null
          current_draw?: number | null
          id?: number
          last_updated?: string | null
          room_id: number
          room_name: string
          status: string
        }
        Update: {
          created_at?: string | null
          current_draw?: number | null
          id?: number
          last_updated?: string | null
          room_id?: number
          room_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          current_draw: number | null
          id: number
          last_updated: string | null
          name: string
          status: string
        }
        Insert: {
          current_draw?: number | null
          id?: number
          last_updated?: string | null
          name: string
          status?: string
        }
        Update: {
          current_draw?: number | null
          id?: number
          last_updated?: string | null
          name?: string
          status?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string | null
          date: string | null
          description: string | null
          end_time: string
          id: number
          room_id: number
          start_time: string
          title: string | null
          updated_at: string | null
          user_id: number
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          end_time: string
          id?: number
          room_id: number
          start_time: string
          title?: string | null
          updated_at?: string | null
          user_id: number
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          end_time?: string
          id?: number
          room_id?: number
          start_time?: string
          title?: string | null
          updated_at?: string | null
          user_id?: number
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean
          id: number
          sensor_threshold: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean
          id?: number
          sensor_threshold?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean
          id?: number
          sensor_threshold?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: number
          password_hash: string
          role: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          password_hash: string
          role: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          password_hash?: string
          role?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      create_activity_logs_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_check_table_exists_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_latest_power_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          room_id: number
          current_draw: number
          recorded_at: string
        }[]
      }
      get_system_settings: {
        Args: Record<PropertyKey, never>
        Returns: {
          sensor_threshold: number
          email_notifications: boolean
        }[]
      }
      insert_activity_log: {
        Args: {
          p_room_id: number
          p_room_name: string
          p_user_id: number
          p_user_name: string
          p_date: string
          p_time: string
          p_status: string
          p_details: string
        }
        Returns: number
      }
      query_activity_logs: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string | null
          date: string
          details: string | null
          id: number
          room_id: number
          room_name: string
          status: string
          time: string
          user_id: number | null
          user_name: string
        }[]
      }
      update_system_settings: {
        Args: { p_sensor_threshold?: number; p_email_notifications?: boolean }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
