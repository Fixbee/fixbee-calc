export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			users: {
				Row: {
					id: string;
					email: string;
					company_name: string | null;
					avatar_url: string | null;
					role: Database['public']['Enums']['app_role'];
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					email: string;
					company_name?: string | null;
					avatar_url?: string | null;
					role?: Database['public']['Enums']['app_role'];
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					company_name?: string | null;
					avatar_url?: string | null;
					role?: Database['public']['Enums']['app_role'];
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			phone_models: {
				Row: {
					id: number;
					model: string;
					base_price: number;
					grade_a_percent: number;
					grade_b_percent: number;
					grade_c_percent: number;
					grade_d_percent: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: number;
					model: string;
					base_price: number;
					grade_a_percent: number;
					grade_b_percent: number;
					grade_c_percent: number;
					grade_d_percent: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: number;
					model?: string;
					base_price?: number;
					grade_a_percent?: number;
					grade_b_percent?: number;
					grade_c_percent?: number;
					grade_d_percent?: number;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			valuations: {
				Row: {
					id: string;
					user_id: string;
					phone_model_id: number;
					phone_color: string;
					imei: string | null;
					imei_unreadable: boolean;
					powers_on_and_displays_image: boolean;
					has_lock: boolean;
					has_visible_damage: boolean;
					all_functions_work: boolean;
					cosmetic_condition: Database['public']['Enums']['phone_cosmetic_condition'];
					grade: Database['public']['Enums']['valuation_grade'];
					proposed_price: number;
					status: Database['public']['Enums']['valuation_status'];
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					phone_model_id: number;
					phone_color: string;
					imei?: string | null;
					imei_unreadable?: boolean;
					powers_on_and_displays_image: boolean;
					has_lock: boolean;
					has_visible_damage: boolean;
					all_functions_work: boolean;
					cosmetic_condition: Database['public']['Enums']['phone_cosmetic_condition'];
					grade: Database['public']['Enums']['valuation_grade'];
					proposed_price: number;
					status: Database['public']['Enums']['valuation_status'];
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					phone_model_id?: number;
					phone_color?: string;
					imei?: string | null;
					imei_unreadable?: boolean;
					powers_on_and_displays_image?: boolean;
					has_lock?: boolean;
					has_visible_damage?: boolean;
					all_functions_work?: boolean;
					cosmetic_condition?: Database['public']['Enums']['phone_cosmetic_condition'];
					grade?: Database['public']['Enums']['valuation_grade'];
					proposed_price?: number;
					status?: Database['public']['Enums']['valuation_status'];
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: {
			app_role: 'admin' | 'user';
			phone_cosmetic_condition: 'none' | 'light' | 'heavy';
			valuation_grade: 'A' | 'B' | 'C' | 'D';
			valuation_status: 'accepted' | 'rejected' | 'abandoned';
		};
		CompositeTypes: Record<string, never>;
	};
};
