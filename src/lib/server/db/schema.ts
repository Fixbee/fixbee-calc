import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';

export const phoneCosmeticConditionEnum = pgEnum('phone_cosmetic_condition', [
	'none',
	'light',
	'heavy'
]);
export const valuationGradeEnum = pgEnum('valuation_grade', ['A', 'B', 'C', 'D']);
export const valuationStatusEnum = pgEnum('valuation_status', [
	'accepted',
	'rejected',
	'abandoned'
]);

export const users = pgTable('users', {
	id: uuid('id').primaryKey().notNull(),
	email: text('email').notNull(),
	companyName: text('company_name'),
	avatarUrl: text('avatar_url'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const phoneModels = pgTable('phone_models', {
	id: serial('id').primaryKey(),
	model: text('model').notNull().unique(),
	basePrice: integer('base_price').notNull(),
	gradeAPercent: integer('grade_a_percent').notNull(),
	gradeBPercent: integer('grade_b_percent').notNull(),
	gradeCPercent: integer('grade_c_percent').notNull(),
	gradeDPercent: integer('grade_d_percent').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const valuations = pgTable(
	'valuations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		phoneModelId: integer('phone_model_id')
			.notNull()
			.references(() => phoneModels.id, { onDelete: 'restrict' }),
		phoneColor: text('phone_color').notNull(),
		imei: text('imei'),
		imeiUnreadable: boolean('imei_unreadable').notNull().default(false),
		powersOnAndDisplaysImage: boolean('powers_on_and_displays_image').notNull(),
		hasLock: boolean('has_lock').notNull(),
		hasVisibleDamage: boolean('has_visible_damage').notNull(),
		allFunctionsWork: boolean('all_functions_work').notNull(),
		cosmeticCondition: phoneCosmeticConditionEnum('cosmetic_condition').notNull(),
		grade: valuationGradeEnum('grade').notNull(),
		proposedPrice: integer('proposed_price').notNull(),
		status: valuationStatusEnum('status').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		byUserAndCreatedAtIdx: index('valuations_user_id_created_at_idx').on(
			table.userId,
			table.createdAt
		),
		byStatusIdx: index('valuations_status_idx').on(table.status)
	})
);

export const valuationHelpTips = pgTable('valuation_help_tips', {
	id: serial('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	titleEn: text('title_en').notNull(),
	titlePl: text('title_pl').notNull(),
	content: jsonb('content').notNull(),
	contentEn: jsonb('content_en').notNull(),
	contentPl: jsonb('content_pl').notNull(),
	sortOrder: integer('sort_order').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
