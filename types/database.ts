export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProgramCategory = "Pelatihan" | "Kajian" | "Pendampingan";
export type ProgramMode = "Online" | "Offline";
export type ProgramStatus = "OPEN" | "FULL" | "COMPLETED";
export type RegistrationPayStatus = "PENDING" | "CONFIRMED" | "PAID" | "EXPIRED";
export type OrderPayStatus = "PENDING" | "PAID" | "EXPIRED";
export type OrderFulfillmentStatus = "UNFULFILLED" | "PROCESSING" | "SHIPPED" | "COMPLETED";

export interface SiteSetting {
  id: string;
  key: string;
  value: Json;
  updated_at: string;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Article {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail_url: string | null;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export interface UstadzProfile {
  id: string;
  name: string;
  title: string;
  photo_url: string | null;
  bio: string;
  expertise_tags: string[];
  is_active: boolean;
  created_at: string;
}

export interface Program {
  id: string;
  ustadz_id: string | null;
  title: string;
  slug: string;
  category: ProgramCategory;
  mode: ProgramMode;
  is_paid: boolean;
  price: number;
  quota: number;
  registered_count: number;
  schedule_date: string;
  location_or_platform: string;
  description: string;
  syllabus: Json;
  status: ProgramStatus;
  poster_url: string | null;
  created_at: string;
}

export interface ProgramAccessDetails {
  program_id: string;
  details: string;
}

export interface ProgramRegistration {
  id: string;
  program_id: string;
  participant_name: string;
  email: string;
  phone_wa: string;
  institution: string | null;
  pay_status: RegistrationPayStatus;
  midtrans_snap_token: string | null;
  payment_amount: number | null;
  payment_expires_at: string | null;
  confirmation_sent_at: string | null;
  midtrans_order_id: string | null;
  midtrans_redirect_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  weight_gram: number;
  material: string | null;
  stock: number;
  variants: string[];
  images_url: string[];
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  phone_wa: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  full_address: string;
  courier_name: string;
  courier_service: string;
  shipping_cost: number;
  subtotal: number;
  total_amount: number;
  pay_status: OrderPayStatus;
  fulfillment_status: OrderFulfillmentStatus;
  tracking_number: string | null;
  tracking_updated_at: string | null;
  tracking_email_sent_at: string | null;
  midtrans_order_id: string | null;
  midtrans_redirect_url: string | null;
  checkout_fingerprint: string | null;
  payment_expires_at: string | null;
  payment_started_at: string | null;
  midtrans_snap_token: string | null;
  confirmation_sent_at: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant: string | null;
  qty: number;
  unit_price: number;
}

export interface MerchandiseOrderItemInput {
  product_id: string;
  variant?: string | null;
  qty: number;
}

export interface CreateMerchandiseOrderArgs {
  p_order_number: string;
  p_customer_name: string;
  p_customer_email: string;
  p_phone_wa: string;
  p_province: string;
  p_city: string;
  p_district: string;
  p_postal_code: string;
  p_full_address: string;
  p_courier_name: string;
  p_courier_service: string;
  p_shipping_cost: number;
  p_items: MerchandiseOrderItemInput[];
}

export interface ReserveMerchandiseOrderArgs extends CreateMerchandiseOrderArgs {
  p_expected_subtotal: number;
  p_weight_gram: number;
  p_checkout_fingerprint: string;
}

type ForeignKey<Name extends string, Column extends string, Table extends string> = {
  foreignKeyName: Name;
  columns: [Column];
  isOneToOne: false;
  referencedRelation: Table;
  referencedColumns: ["id"];
};

type Table<Row, Required extends keyof Row, Relationships extends unknown[] = []> = {
  Row: { [Column in keyof Row]: Row[Column] };
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

export interface Database {
  public: {
    Tables: {
      site_settings: Table<SiteSetting, "key" | "value">;
      article_categories: Table<ArticleCategory, "name" | "slug">;
      articles: Table<
        Article,
        "category_id" | "title" | "slug" | "excerpt" | "content",
        [ForeignKey<"articles_category_id_fkey", "category_id", "article_categories">]
      >;
      ustadz_profiles: Table<UstadzProfile, "name" | "title" | "bio">;
      programs: Table<
        Program,
        "title" | "slug" | "category" | "mode" | "quota" | "schedule_date" |
        "location_or_platform" | "description",
        [ForeignKey<"programs_ustadz_id_fkey", "ustadz_id", "ustadz_profiles">]
      >;
      program_registrations: Table<
        ProgramRegistration,
        "program_id" | "participant_name" | "email" | "phone_wa",
        [ForeignKey<"program_registrations_program_id_fkey", "program_id", "programs">]
      >;
      program_access_details: Table<ProgramAccessDetails, "program_id" | "details">;
      products: Table<Product, "name" | "slug" | "description" | "price" | "weight_gram" | "stock">;
      orders: Table<
        Order,
        "order_number" | "customer_name" | "customer_email" | "phone_wa" | "province" |
        "city" | "district" | "postal_code" | "full_address" | "courier_name" |
        "courier_service" | "shipping_cost" | "subtotal" | "total_amount"
      >;
      order_items: Table<
        OrderItem,
        "order_id" | "product_id" | "product_name" | "qty" | "unit_price",
        [
          ForeignKey<"order_items_order_id_fkey", "order_id", "orders">,
          ForeignKey<"order_items_product_id_fkey", "product_id", "products">,
        ]
      >;
    };
    Views: Record<never, never>;
    Functions: {
      admin_dashboard_metrics: {
        Args: Record<never, never>;
        Returns: {
          program_revenue: number;
          merchandise_revenue: number;
          processing_orders: number;
          registered_participants: number;
        }[];
      };
      admin_ship_order: {
        Args: { p_order_id: string; p_tracking_number: string };
        Returns: Order;
      };
      register_program: {
        Args: {
          p_id: string;
          p_slug: string;
          p_name: string;
          p_email: string;
          p_phone: string;
          p_institution: string | null;
        };
        Returns: ProgramRegistration;
      };
      update_program_payment: {
        Args: {
          p_order_id: string;
          p_amount: number;
          p_status: "PAID" | "EXPIRED";
        };
        Returns: ProgramRegistration;
      };
      create_merchandise_order: {
        Args: { [Key in keyof CreateMerchandiseOrderArgs]: CreateMerchandiseOrderArgs[Key] }
          | { [Key in keyof ReserveMerchandiseOrderArgs]: ReserveMerchandiseOrderArgs[Key] };
        Returns: Order;
      };
      release_unpublished_order: {
        Args: { p_order_id: string };
        Returns: boolean;
      };
      restore_order_stock: {
        Args: { p_order_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      program_category: ProgramCategory;
      program_mode: ProgramMode;
      program_status: ProgramStatus;
      registration_pay_status: RegistrationPayStatus;
      order_pay_status: OrderPayStatus;
      order_fulfillment_status: OrderFulfillmentStatus;
    };
    CompositeTypes: Record<never, never>;
  };
}
