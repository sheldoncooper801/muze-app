import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Songs table
export const songs = sqliteTable("songs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  artist: text("artist").notNull().default("MUZE"),
  album: text("album"),
  genre: text("genre").notNull().default("R&B"),
  duration: integer("duration").notNull().default(0),
  price: real("price").notNull().default(1.99),
  coverUrl: text("cover_url"),
  audioUrl: text("audio_url"),
  description: text("description"),
  lyrics: text("lyrics"),
  releaseYear: integer("release_year"),
  featured: integer("featured", { mode: "boolean" }).default(false),
  playCount: integer("play_count").default(0),
  bpm: integer("bpm"),
  keySignature: text("key_signature"),
});

export const insertSongSchema = createInsertSchema(songs).omit({ id: true, playCount: true });
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songs.$inferSelect;

// Playlists table
export const playlists = sqliteTable("playlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  songIds: text("song_ids").notNull().default("[]"),
  isSystem: integer("is_system", { mode: "boolean" }).default(false),
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({ id: true });
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

// Liked songs table
export const likedSongs = sqliteTable("liked_songs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  songId: integer("song_id").notNull(),
  likedAt: integer("liked_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertLikedSongSchema = createInsertSchema(likedSongs).omit({ id: true, likedAt: true });
export type InsertLikedSong = z.infer<typeof insertLikedSongSchema>;
export type LikedSong = typeof likedSongs.$inferSelect;

// Listening history table
export const listeningHistory = sqliteTable("listening_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  songId: integer("song_id").notNull(),
  playedAt: integer("played_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertHistorySchema = createInsertSchema(listeningHistory).omit({ id: true, playedAt: true });
export type InsertHistory = z.infer<typeof insertHistorySchema>;
export type ListeningHistory = typeof listeningHistory.$inferSelect;

// Orders table (legacy — kept for compatibility)
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  songId: integer("song_id").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerName: text("buyer_name"),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// ─── PAYMENTS TABLE ────────────────────────────────────────────────────────────
// Tracks every purchase with full split accounting
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // What was purchased
  itemType: text("item_type").notNull(), // "song" | "album" | "gift_tip"
  itemId: text("item_id"),               // song id, album name, or null for general tip
  itemTitle: text("item_title").notNull(),
  // Who paid
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  // Recipient (for gift purchases)
  recipientName: text("recipient_name"),
  recipientEmail: text("recipient_email"),
  giftMessage: text("gift_message"),
  isGift: integer("is_gift", { mode: "boolean" }).default(false),
  // Money
  grossAmount: real("gross_amount").notNull(),
  muzeSplit: real("muze_split").notNull(),      // 40% platform fee
  artistSplit: real("artist_split").notNull(),  // 60% to artist
  // Payment method
  paymentMethod: text("payment_method").notNull(), // "cashapp" | "zelle"
  paymentHandle: text("payment_handle"),           // $cashtag or zelle@email.com (MUZE's)
  // State machine: pending → awaiting_confirmation → confirmed | failed
  status: text("status").notNull().default("pending"),
  // Security
  confirmationToken: text("confirmation_token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true, createdAt: true, confirmedAt: true,
  muzeSplit: true, artistSplit: true, confirmationToken: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// ─── ARTISTS TABLE ───────────────────────────────────────────────────────────
// Artist accounts with full security: hashed password, phone, email verification,
// security questions (hashed answers), and password-reset token support
export const artists = sqliteTable("artists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),           // unique — enforced in storage
  passwordHash: text("password_hash").notNull(),
  phone: text("phone").notNull(),
  // Email verification
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  verificationToken: text("verification_token"),  // UUID sent in email
  verificationExpiry: integer("verification_expiry"), // epoch ms
  // Security questions (answers are bcrypt-hashed at rest)
  sq1: text("sq1").notNull(),   // question text
  sa1: text("sa1").notNull(),   // bcrypt hash of answer
  sq2: text("sq2").notNull(),
  sa2: text("sa2").notNull(),
  sq3: text("sq3").notNull(),
  sa3: text("sa3").notNull(),
  // Password reset flow
  resetToken: text("reset_token"),
  resetExpiry: integer("reset_expiry"),     // epoch ms
  resetVerified: integer("reset_verified", { mode: "boolean" }).default(false), // passed security questions
  // Metadata
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  lastLogin: integer("last_login", { mode: "timestamp" }),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: integer("locked_until"),    // epoch ms — lockout after 5 failed attempts
});

export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true, isVerified: true, verificationToken: true, verificationExpiry: true,
  resetToken: true, resetExpiry: true, resetVerified: true,
  createdAt: true, lastLogin: true, loginAttempts: true, lockedUntil: true,
});
export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artists.$inferSelect;

// ─── RATE LIMIT TABLE ─────────────────────────────────────────────────────────
export const rateLimits = sqliteTable("rate_limits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull(),      // ip:action or email:action
  hits: integer("hits").notNull().default(1),
  windowStart: integer("window_start").notNull(), // epoch ms
});
