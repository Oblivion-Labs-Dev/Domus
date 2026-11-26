import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/domus.db";

if (databaseUrl.startsWith("file:")) {
  const filePath = databaseUrl.replace(/^file:/, "");
  const resolvedDir = path.dirname(path.resolve(process.cwd(), filePath));
  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
  }
}

export const client = createClient({
  url: databaseUrl,
});

export const db = drizzle(client, { schema });

let initialized = false;

export async function ensureTables(): Promise<void> {
  if (initialized) return;

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS households (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
      quiet_hours_start TEXT NOT NULL DEFAULT '22:00',
      quiet_hours_end TEXT NOT NULL DEFAULT '07:00',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Family Member',
      color TEXT NOT NULL DEFAULT '#4f7c5b',
      avatar_initials TEXT NOT NULL,
      permissions_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS house_resources (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'GEAR',
      icon_asset TEXT NOT NULL DEFAULT '/assets/decor-car.png',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'FAMILY',
      owner_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      participant_ids_json TEXT NOT NULL DEFAULT '[]',
      resource_id TEXT REFERENCES house_resources(id) ON DELETE SET NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'FAMILY',
      is_shared INTEGER NOT NULL DEFAULT 0,
      location TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS time_bookings (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      requester_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      target_member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      resource_id TEXT REFERENCES house_resources(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'BOOKING',
      notes TEXT DEFAULT '',
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      approved_by_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      created_event_id TEXT REFERENCES calendar_events(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      scope TEXT NOT NULL,
      owner_id TEXT REFERENCES members(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS board_columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#787164',
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS board_cards (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      column_id TEXT NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      card_type TEXT NOT NULL DEFAULT 'TASK',
      note_color TEXT NOT NULL DEFAULT 'cream',
      tags_json TEXT NOT NULL DEFAULT '[]',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      assignee_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      resource_id TEXT REFERENCES house_resources(id) ON DELETE SET NULL,
      due_date TEXT DEFAULT '',
      start_time TEXT DEFAULT '',
      end_time TEXT DEFAULT '',
      sync_to_common_calendar INTEGER NOT NULL DEFAULT 1,
      linked_event_id TEXT REFERENCES calendar_events(id) ON DELETE SET NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_by_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_configs (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      owner_key TEXT NOT NULL,
      room_title TEXT NOT NULL,
      theme TEXT NOT NULL DEFAULT 'stone',
      banner_quote TEXT DEFAULT '',
      layout_json TEXT NOT NULL DEFAULT '["board","trackers","stickies"]',
      decor_items_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_knocks (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      visitor_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      room_owner_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'KNOCKING',
      created_at TEXT NOT NULL,
      responded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS trackers (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      target_value REAL NOT NULL,
      current_value REAL NOT NULL DEFAULT 0,
      cadence TEXT NOT NULL DEFAULT 'WEEKLY',
      visibility TEXT NOT NULL DEFAULT 'FAMILY',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tracker_logs (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      tracker_id TEXT NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      value REAL NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS household_lists (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'FAMILY',
      created_by_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS list_items (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL REFERENCES household_lists(id) ON DELETE CASCADE,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      quantity TEXT DEFAULT '',
      assignee_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      due_date TEXT DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_by_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      completed_at TEXT,
      created_by_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      actor_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS house_polls (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      tag TEXT NOT NULL DEFAULT 'home',
      options_json TEXT NOT NULL DEFAULT '[]',
      created_by_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fridge_meals (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL DEFAULT 'DINNER',
      dish TEXT NOT NULL,
      chef_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      notes TEXT DEFAULT '',
      linked_event_id TEXT REFERENCES calendar_events(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_workouts (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      exercises_json TEXT NOT NULL DEFAULT '[]',
      participant_ids_json TEXT NOT NULL DEFAULT '[]',
      completed_ids_json TEXT NOT NULL DEFAULT '[]',
      linked_event_id TEXT REFERENCES calendar_events(id) ON DELETE SET NULL,
      created_by_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );
  `);

  // Safe migrations for existing local SQLite databases
  const safeAlters = [
    "ALTER TABLE households ADD COLUMN house_key TEXT NOT NULL DEFAULT 'DOMUS-HOME'",
    "ALTER TABLE calendar_events ADD COLUMN resource_id TEXT REFERENCES house_resources(id) ON DELETE SET NULL",
    "ALTER TABLE time_bookings ADD COLUMN resource_id TEXT REFERENCES house_resources(id) ON DELETE SET NULL",
    "ALTER TABLE board_columns ADD COLUMN icon_asset TEXT DEFAULT ''",
    "ALTER TABLE board_cards ADD COLUMN icon_asset TEXT DEFAULT ''",
    "ALTER TABLE room_configs ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE household_lists ADD COLUMN due_date TEXT DEFAULT ''",
  ];
  for (const sql of safeAlters) {
    try {
      await client.execute(sql);
    } catch {
      // Column already exists
    }
  }

  initialized = true;
}
