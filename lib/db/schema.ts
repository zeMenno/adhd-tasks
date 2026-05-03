import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Tables ──────────────────────────────────────────────────────────────────

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  pin: text("pin").notNull(),
  color: text("color").notNull(),
  avatar: text("avatar"),
  totalPoints: integer("total_points").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  lastCompletionDate: date("last_completion_date"),
  snoozedUntil: timestamp("snoozed_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const devices = pgTable("devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  assignedUserId: uuid("assigned_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  ownerUserId: uuid("owner_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  basePoints: integer("base_points").notNull().default(10),
  penaltyPerDay: integer("penalty_per_day").notNull().default(2),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  recurrenceType: text("recurrence_type").notNull(),
  recurrenceDayOfWeek: integer("recurrence_day_of_week"),
  recurrenceDayOfMonth: integer("recurrence_day_of_month"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const taskInstances = pgTable("task_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  assignedUserId: uuid("assigned_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull().default("todo"),
  completedAt: timestamp("completed_at"),
  approvedAt: timestamp("approved_at"),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  earnedPoints: integer("earned_points"),
  daysOverdue: integer("days_overdue").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rewards = pgTable("rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rewardId: uuid("reward_id").references(() => rewards.id, {
    onDelete: "set null",
  }),
  taskInstanceId: uuid("task_instance_id").references(() => taskInstances.id, {
    onDelete: "set null",
  }),
  points: integer("points").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const householdsRelations = relations(households, ({ many }) => ({
  users: many(users),
  tasks: many(tasks),
  rewards: many(rewards),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  household: one(households, {
    fields: [users.householdId],
    references: [households.id],
  }),
  devices: many(devices),
  assignedTasks: many(tasks, { relationName: "assignedUser" }),
  ownedTasks: many(tasks, { relationName: "ownerUser" }),
  assignedInstances: many(taskInstances, { relationName: "assignedInstance" }),
  approvedInstances: many(taskInstances, { relationName: "approvedInstance" }),
  transactions: many(transactions),
}));

export const devicesRelations = relations(devices, ({ one }) => ({
  user: one(users, {
    fields: [devices.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  household: one(households, {
    fields: [tasks.householdId],
    references: [households.id],
  }),
  assignedUser: one(users, {
    fields: [tasks.assignedUserId],
    references: [users.id],
    relationName: "assignedUser",
  }),
  ownerUser: one(users, {
    fields: [tasks.ownerUserId],
    references: [users.id],
    relationName: "ownerUser",
  }),
  instances: many(taskInstances),
}));

export const taskInstancesRelations = relations(taskInstances, ({ one, many }) => ({
  task: one(tasks, {
    fields: [taskInstances.taskId],
    references: [tasks.id],
  }),
  assignedUser: one(users, {
    fields: [taskInstances.assignedUserId],
    references: [users.id],
    relationName: "assignedInstance",
  }),
  approvedByUser: one(users, {
    fields: [taskInstances.approvedByUserId],
    references: [users.id],
    relationName: "approvedInstance",
  }),
  transactions: many(transactions),
}));

export const rewardsRelations = relations(rewards, ({ one, many }) => ({
  household: one(households, {
    fields: [rewards.householdId],
    references: [households.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  reward: one(rewards, {
    fields: [transactions.rewardId],
    references: [rewards.id],
  }),
  taskInstance: one(taskInstances, {
    fields: [transactions.taskInstanceId],
    references: [taskInstances.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Household = typeof households.$inferSelect;
export type NewHousehold = typeof households.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type TaskInstance = typeof taskInstances.$inferSelect;
export type NewTaskInstance = typeof taskInstances.$inferInsert;

export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type RecurrenceType = "once" | "daily" | "weekly" | "biweekly" | "monthly";
export type TaskStatus = "todo" | "done" | "approved" | "completed";
