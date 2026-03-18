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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type_enum"]
          background_img_url: string | null
          balance: number
          bank_name: string | null
          card_network_url: string | null
          card_type: string | null
          created_at: string
          currency: string
          hidden: boolean
          id: string
          is_active: boolean
          is_deleted: boolean | null
          masked_identifier: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type_enum"]
          background_img_url?: string | null
          balance?: number
          bank_name?: string | null
          card_network_url?: string | null
          card_type?: string | null
          created_at?: string
          currency?: string
          hidden?: boolean
          id?: string
          is_active?: boolean
          is_deleted?: boolean | null
          masked_identifier: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type_enum"]
          background_img_url?: string | null
          balance?: number
          bank_name?: string | null
          card_network_url?: string | null
          card_type?: string | null
          created_at?: string
          currency?: string
          hidden?: boolean
          id?: string
          is_active?: boolean
          is_deleted?: boolean | null
          masked_identifier?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      activity: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type_enum"]
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          occurred_at: string
          reference_id: string | null
          reference_table: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type_enum"]
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string
          reference_id?: string | null
          reference_table?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type_enum"]
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string
          reference_id?: string | null
          reference_table?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message: {
        Row: {
          id: string
          thread_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          role?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_thread"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_thread: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_thread_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          currency: string
          id: string
          name: string | null
          period_start_date: string
          period_type: Database["public"]["Enums"]["budget_period_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          name?: string | null
          period_start_date: string
          period_type: Database["public"]["Enums"]["budget_period_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          name?: string | null
          period_start_date?: string
          period_type?: Database["public"]["Enums"]["budget_period_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "merchant_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      card_payment: {
        Row: {
          amount: number
          created_at: string
          credit_card_id: string
          currency: string
          from_account_id: string
          id: string
          note: string | null
          paid_at: string | null
          payment_installment_id: string | null
          status: Database["public"]["Enums"]["transaction_status_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credit_card_id: string
          currency: string
          from_account_id: string
          id?: string
          note?: string | null
          paid_at?: string | null
          payment_installment_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credit_card_id?: string
          currency?: string
          from_account_id?: string
          id?: string
          note?: string | null
          paid_at?: string | null
          payment_installment_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_payment_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_payment_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_payment_payment_installment_id_fkey"
            columns: ["payment_installment_id"]
            isOneToOne: false
            referencedRelation: "payment_installment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_payment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card: {
        Row: {
          background_img_url: string | null
          balance_owed: number
          card_network_url: string | null
          card_type: string | null
          created_at: string
          credit_limit: number
          currency: string
          default_payment_account_id: string | null
          id: string
          is_active: boolean
          is_blocked: boolean | null
          is_blocked_date: string | null
          is_deleted: boolean | null
          is_unblocked_date: string | null
          masked_identifier: string
          name: string
          payment_due_day: number | null
          statement_day: number | null
          temporary_blocked: boolean | null
          temporary_blocked_date: string | null
          temporary_unblocked_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_img_url?: string | null
          balance_owed?: number
          card_network_url?: string | null
          card_type?: string | null
          created_at?: string
          credit_limit: number
          currency?: string
          default_payment_account_id?: string | null
          id?: string
          is_active?: boolean
          is_blocked?: boolean | null
          is_blocked_date?: string | null
          is_deleted?: boolean | null
          is_unblocked_date?: string | null
          masked_identifier: string
          name: string
          payment_due_day?: number | null
          statement_day?: number | null
          temporary_blocked?: boolean | null
          temporary_blocked_date?: string | null
          temporary_unblocked_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_img_url?: string | null
          balance_owed?: number
          card_network_url?: string | null
          card_type?: string | null
          created_at?: string
          credit_limit?: number
          currency?: string
          default_payment_account_id?: string | null
          id?: string
          is_active?: boolean
          is_blocked?: boolean | null
          is_blocked_date?: string | null
          is_deleted?: boolean | null
          is_unblocked_date?: string | null
          masked_identifier?: string
          name?: string
          payment_due_day?: number | null
          statement_day?: number | null
          temporary_blocked?: boolean | null
          temporary_blocked_date?: string | null
          temporary_unblocked_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_default_payment_account_id_fkey"
            columns: ["default_payment_account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      income: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          currency: string
          id: string
          note: string | null
          received_at: string
          source: Database["public"]["Enums"]["income_source_enum"]
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          currency: string
          id?: string
          note?: string | null
          received_at?: string
          source: Database["public"]["Enums"]["income_source_enum"]
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          received_at?: string
          source?: Database["public"]["Enums"]["income_source_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          merchant_id: string | null
          note: string | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["invoice_status_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          due_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          merchant_id?: string | null
          note?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["invoice_status_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          merchant_id?: string | null
          note?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["invoice_status_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "merchant_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_category: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      notification: {
        Row: {
          body: string | null
          created_at: string
          dedupe_key: string | null
          email_sent_at: string | null
          id: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type_enum"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          email_sent_at?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type_enum"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          email_sent_at?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preference: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel_enum"]
          created_at: string
          enabled: boolean
          id: string
          notification_type: Database["public"]["Enums"]["notification_type_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel_enum"]
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type: Database["public"]["Enums"]["notification_type_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel_enum"]
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type?: Database["public"]["Enums"]["notification_type_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preference_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      payment: {
        Row: {
          amount: number
          auto_charge_installments: boolean
          created_at: string
          currency: string
          due_date: string | null
          fee_amount: number
          fee_currency: string | null
          from_account_id: string | null
          from_credit_card_id: string | null
          id: string
          invoice_id: string | null
          is_recurring: boolean
          merchant_id: string
          note: string | null
          paid_at: string | null
          payment_schedule_id: string | null
          payment_type: Database["public"]["Enums"]["payment_type_enum"]
          recurrence_frequency:
            | Database["public"]["Enums"]["recurrence_frequency_enum"]
            | null
          status: Database["public"]["Enums"]["transaction_status_enum"]
          updated_at: string
          user_id: string
          virtual_account: string | null
        }
        Insert: {
          amount: number
          auto_charge_installments?: boolean
          created_at?: string
          currency: string
          due_date?: string | null
          fee_amount?: number
          fee_currency?: string | null
          from_account_id?: string | null
          from_credit_card_id?: string | null
          id?: string
          invoice_id?: string | null
          is_recurring?: boolean
          merchant_id: string
          note?: string | null
          paid_at?: string | null
          payment_schedule_id?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type_enum"]
          recurrence_frequency?:
            | Database["public"]["Enums"]["recurrence_frequency_enum"]
            | null
          status?: Database["public"]["Enums"]["transaction_status_enum"]
          updated_at?: string
          user_id: string
          virtual_account?: string | null
        }
        Update: {
          amount?: number
          auto_charge_installments?: boolean
          created_at?: string
          currency?: string
          due_date?: string | null
          fee_amount?: number
          fee_currency?: string | null
          from_account_id?: string | null
          from_credit_card_id?: string | null
          id?: string
          invoice_id?: string | null
          is_recurring?: boolean
          merchant_id?: string
          note?: string | null
          paid_at?: string | null
          payment_schedule_id?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type_enum"]
          recurrence_frequency?:
            | Database["public"]["Enums"]["recurrence_frequency_enum"]
            | null
          status?: Database["public"]["Enums"]["transaction_status_enum"]
          updated_at?: string
          user_id?: string
          virtual_account?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_from_credit_card_id_fkey"
            columns: ["from_credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_payment_schedule_id_fkey"
            columns: ["payment_schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_installment: {
        Row: {
          amount: number
          created_at: string
          credit_card_id: string | null
          due_date: string
          id: string
          installment_number: number
          paid_at: string | null
          payment_id: string
          posted_at: string | null
          status: Database["public"]["Enums"]["transaction_status_enum"]
        }
        Insert: {
          amount: number
          created_at?: string
          credit_card_id?: string | null
          due_date: string
          id?: string
          installment_number: number
          paid_at?: string | null
          payment_id: string
          posted_at?: string | null
          status?: Database["public"]["Enums"]["transaction_status_enum"]
        }
        Update: {
          amount?: number
          created_at?: string
          credit_card_id?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          paid_at?: string | null
          payment_id?: string
          posted_at?: string | null
          status?: Database["public"]["Enums"]["transaction_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_installment_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installment_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedule: {
        Row: {
          amount: number
          auto_pay_account_id: string | null
          auto_pay_credit_card_id: string | null
          auto_pay_enabled: boolean
          created_at: string
          currency: string
          fee_amount: number
          id: string
          merchant_id: string
          next_due_date: string
          note: string | null
          recurrence_frequency: Database["public"]["Enums"]["recurrence_frequency_enum"]
          schedule_type: Database["public"]["Enums"]["payment_type_enum"]
          status: string
          updated_at: string
          user_id: string
          virtual_account: string | null
        }
        Insert: {
          amount: number
          auto_pay_account_id?: string | null
          auto_pay_credit_card_id?: string | null
          auto_pay_enabled?: boolean
          created_at?: string
          currency: string
          fee_amount?: number
          id?: string
          merchant_id: string
          next_due_date: string
          note?: string | null
          recurrence_frequency: Database["public"]["Enums"]["recurrence_frequency_enum"]
          schedule_type: Database["public"]["Enums"]["payment_type_enum"]
          status?: string
          updated_at?: string
          user_id: string
          virtual_account?: string | null
        }
        Update: {
          amount?: number
          auto_pay_account_id?: string | null
          auto_pay_credit_card_id?: string | null
          auto_pay_enabled?: boolean
          created_at?: string
          currency?: string
          fee_amount?: number
          id?: string
          merchant_id?: string
          next_due_date?: string
          note?: string | null
          recurrence_frequency?: Database["public"]["Enums"]["recurrence_frequency_enum"]
          schedule_type?: Database["public"]["Enums"]["payment_type_enum"]
          status?: string
          updated_at?: string
          user_id?: string
          virtual_account?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedule_auto_pay_account_id_fkey"
            columns: ["auto_pay_account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_auto_pay_credit_card_id_fkey"
            columns: ["auto_pay_credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      recipient: {
        Row: {
          account_number: string
          bank_code: string | null
          bank_name: string | null
          country_code: string | null
          created_at: string
          currency: string | null
          display_name: string
          id: string
          user_id: string
        }
        Insert: {
          account_number: string
          bank_code?: string | null
          bank_name?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          display_name: string
          id?: string
          user_id: string
        }
        Update: {
          account_number?: string
          bank_code?: string | null
          bank_name?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipient_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      saving_plan: {
        Row: {
          account_id: string | null
          created_at: string
          currency: string
          current_amount: number
          icon: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["saving_plan_status_enum"]
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          icon?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["saving_plan_status_enum"]
          target_amount: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          icon?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["saving_plan_status_enum"]
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saving_plan_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saving_plan_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      saving_plan_contribution: {
        Row: {
          amount: number
          contribution_type: Database["public"]["Enums"]["saving_plan_contribution_type_enum"]
          created_at: string
          from_account_id: string | null
          id: string
          note: string | null
          saving_plan_id: string
          to_account_id: string | null
        }
        Insert: {
          amount: number
          contribution_type: Database["public"]["Enums"]["saving_plan_contribution_type_enum"]
          created_at?: string
          from_account_id?: string | null
          id?: string
          note?: string | null
          saving_plan_id: string
          to_account_id?: string | null
        }
        Update: {
          amount?: number
          contribution_type?: Database["public"]["Enums"]["saving_plan_contribution_type_enum"]
          created_at?: string
          from_account_id?: string | null
          id?: string
          note?: string | null
          saving_plan_id?: string
          to_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saving_plan_contribution_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saving_plan_contribution_saving_plan_id_fkey"
            columns: ["saving_plan_id"]
            isOneToOne: false
            referencedRelation: "saving_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saving_plan_contribution_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          lemon_customer_id: string | null
          lemon_order_id: string | null
          lemon_product_id: string | null
          lemon_subscription_id: string | null
          lemon_variant_id: string | null
          plan_id: string | null
          status: Database["public"]["Enums"]["subscription_status_enum"]
          stripe_customer_id: string | null
          stripe_price_id: string
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          lemon_customer_id?: string | null
          lemon_order_id?: string | null
          lemon_product_id?: string | null
          lemon_subscription_id?: string | null
          lemon_variant_id?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status_enum"]
          stripe_customer_id?: string | null
          stripe_price_id: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          lemon_customer_id?: string | null
          lemon_order_id?: string | null
          lemon_product_id?: string | null
          lemon_subscription_id?: string | null
          lemon_variant_id?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status_enum"]
          stripe_customer_id?: string | null
          stripe_price_id?: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plan: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["subscription_interval_enum"]
          is_active: boolean
          lemon_variant_id: string | null
          name: string
          slug: string
          stripe_price_id: string
          stripe_product_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval: Database["public"]["Enums"]["subscription_interval_enum"]
          is_active?: boolean
          lemon_variant_id?: string | null
          name: string
          slug: string
          stripe_price_id: string
          stripe_product_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["subscription_interval_enum"]
          is_active?: boolean
          lemon_variant_id?: string | null
          name?: string
          slug?: string
          stripe_price_id?: string
          stripe_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transaction_fee: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fee_type: Database["public"]["Enums"]["fee_type_enum"]
          id: string
          payment_id: string | null
          transfer_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          fee_type: Database["public"]["Enums"]["fee_type_enum"]
          id?: string
          payment_id?: string | null
          transfer_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fee_type?: Database["public"]["Enums"]["fee_type_enum"]
          id?: string
          payment_id?: string | null
          transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_fee_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_fee_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          fee_amount: number
          fee_currency: string | null
          from_account_id: string
          id: string
          note: string | null
          reference: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["transaction_status_enum"]
          to_account_id: string | null
          to_recipient_id: string | null
          transfer_method: Database["public"]["Enums"]["transfer_method_enum"]
          transfer_type: Database["public"]["Enums"]["transfer_type_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency: string
          fee_amount?: number
          fee_currency?: string | null
          from_account_id: string
          id?: string
          note?: string | null
          reference?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["transaction_status_enum"]
          to_account_id?: string | null
          to_recipient_id?: string | null
          transfer_method: Database["public"]["Enums"]["transfer_method_enum"]
          transfer_type: Database["public"]["Enums"]["transfer_type_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          fee_amount?: number
          fee_currency?: string | null
          from_account_id?: string
          id?: string
          note?: string | null
          reference?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["transaction_status_enum"]
          to_account_id?: string | null
          to_recipient_id?: string | null
          transfer_method?: Database["public"]["Enums"]["transfer_method_enum"]
          transfer_type?: Database["public"]["Enums"]["transfer_type_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_to_recipient_id_fkey"
            columns: ["to_recipient_id"]
            isOneToOne: false
            referencedRelation: "recipient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          ai_provider: string
          ai_system_prompt: string | null
          anthropic_api_key: string | null
          avatar_url: string | null
          created_at: string
          currency: string | null
          first_name: string | null
          gemini_api_key: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          openai_api_key: string | null
          lemon_customer_id: string | null
          openrouter_api_key: string | null
          openrouter_model: string | null
          phone_number: string | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          ai_provider?: string
          ai_system_prompt?: string | null
          anthropic_api_key?: string | null
          avatar_url?: string | null
          created_at?: string
          currency?: string | null
          first_name?: string | null
          gemini_api_key?: string | null
          id: string
          last_name?: string | null
          lemon_customer_id?: string | null
          middle_name?: string | null
          openai_api_key?: string | null
          openrouter_api_key?: string | null
          openrouter_model?: string | null
          phone_number?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_provider?: string
          ai_system_prompt?: string | null
          anthropic_api_key?: string | null
          avatar_url?: string | null
          created_at?: string
          currency?: string | null
          first_name?: string | null
          gemini_api_key?: string | null
          id?: string
          last_name?: string | null
          lemon_customer_id?: string | null
          middle_name?: string | null
          openai_api_key?: string | null
          openrouter_api_key?: string | null
          openrouter_model?: string | null
          phone_number?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activity_insert: {
        Args: {
          p_activity_type: Database["public"]["Enums"]["activity_type_enum"]
          p_amount?: number
          p_currency?: string
          p_metadata?: Json
          p_occurred_at?: string
          p_reference_id?: string
          p_reference_table?: string
          p_summary?: string
          p_user_id: string
        }
        Returns: undefined
      }
      atomic_transfer_funds: {
        Args: {
          p_amount: number
          p_from_account_id: string
          p_to_account_id: string
          p_user_id: string
        }
        Returns: Json
      }
      generate_due_notifications: {
        Args: { days_before?: number }
        Returns: undefined
      }
    }
    Enums: {
      account_type_enum:
        | "savings"
        | "current"
        | "checking"
        | "e_wallet"
        | "cash"
        | "other"
      activity_type_enum:
        | "payment"
        | "transfer"
        | "income"
        | "card_payment"
        | "account_updated"
        | "credit_card_updated"
        | "profile_updated"
        | "subscription_started"
        | "subscription_canceled"
      budget_period_enum: "week" | "month" | "quarter" | "year"
      fee_type_enum:
        | "local_transfer"
        | "international_transfer"
        | "wire_fee"
        | "currency_conversion"
        | "merchant_payment"
        | "other"
      income_source_enum:
        | "salary"
        | "freelance"
        | "refund"
        | "interest"
        | "dividend"
        | "rent_income"
        | "gift"
        | "other"
      invoice_status_enum: "draft" | "pending" | "paid" | "overdue" | "unpaid"
      notification_channel_enum: "in_app" | "email"
      notification_type_enum:
        | "installment_due"
        | "installment_past_due"
        | "subscription_credited"
        | "card_statement_due"
        | "card_payment_due"
        | "budget_warning"
        | "budget_exceeded"
        | "general"
      payment_type_enum:
        | "one_time"
        | "recurring"
        | "subscription"
        | "installment"
      recurrence_frequency_enum:
        | "weekly"
        | "biweekly"
        | "monthly"
        | "quarterly"
        | "yearly"
      saving_plan_contribution_type_enum: "contribution" | "withdrawal"
      saving_plan_status_enum: "in_progress" | "completed" | "behind_schedule"
      subscription_interval_enum: "month" | "year"
      subscription_status_enum:
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused"
      transaction_status_enum:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      transfer_method_enum: "instaPay" | "pesoNet" | "wire" | "cash"
      transfer_type_enum: "local" | "international"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      account_type_enum: [
        "savings",
        "current",
        "checking",
        "e_wallet",
        "cash",
        "other",
      ],
      activity_type_enum: [
        "payment",
        "transfer",
        "income",
        "card_payment",
        "account_updated",
        "credit_card_updated",
        "profile_updated",
        "subscription_started",
        "subscription_canceled",
      ],
      budget_period_enum: ["week", "month", "quarter", "year"],
      fee_type_enum: [
        "local_transfer",
        "international_transfer",
        "wire_fee",
        "currency_conversion",
        "merchant_payment",
        "other",
      ],
      income_source_enum: [
        "salary",
        "freelance",
        "refund",
        "interest",
        "dividend",
        "rent_income",
        "gift",
        "other",
      ],
      invoice_status_enum: ["draft", "pending", "paid", "overdue", "unpaid"],
      notification_channel_enum: ["in_app", "email"],
      notification_type_enum: [
        "installment_due",
        "installment_past_due",
        "subscription_credited",
        "card_statement_due",
        "card_payment_due",
        "budget_warning",
        "budget_exceeded",
        "general",
      ],
      payment_type_enum: [
        "one_time",
        "recurring",
        "subscription",
        "installment",
      ],
      recurrence_frequency_enum: [
        "weekly",
        "biweekly",
        "monthly",
        "quarterly",
        "yearly",
      ],
      saving_plan_contribution_type_enum: ["contribution", "withdrawal"],
      saving_plan_status_enum: ["in_progress", "completed", "behind_schedule"],
      subscription_interval_enum: ["month", "year"],
      subscription_status_enum: [
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
      transaction_status_enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      transfer_method_enum: ["instaPay", "pesoNet", "wire", "cash"],
      transfer_type_enum: ["local", "international"],
    },
  },
} as const
