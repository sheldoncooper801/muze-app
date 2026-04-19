import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertSongSchema, insertPlaylistSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";

// ─── Security helpers ────────────────────────────────────────────────────────
function getClientIp(req: any): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
    || req.socket?.remoteAddress
    || "unknown";
}

// Validation schema for creating a payment
const createPaymentSchema = z.object({
  itemType: z.enum(["song", "album", "gift_tip"]),
  itemId: z.string().optional(),
  itemTitle: z.string().min(1).max(200),
  buyerName: z.string().min(1).max(100),
  buyerEmail: z.string().email(),
  recipientName: z.string().max(100).optional(),
  recipientEmail: z.string().email().optional(),
  giftMessage: z.string().max(500).optional(),
  isGift: z.boolean().optional().default(false),
  grossAmount: z.number().min(0.50).max(500),
  paymentMethod: z.enum(["cashapp", "zelle"]),
});

// MUZE payment handles (visible to users to send money)
const PAYMENT_HANDLES = {
  cashapp: "$MUZEmusic",
  zelle: "payments@muze.music",
};

// In-memory store for fan tips and listening parties
interface FanTip {
  id: number;
  songId: number | null;
  fromName: string;
  fromEmail: string;
  amount: number;
  message: string;
  createdAt: number;
}
interface PartyRoom {
  id: string;
  name: string;
  hostName: string;
  currentSongId: number | null;
  currentTime: number;
  isPlaying: boolean;
  queue: number[];
  listeners: string[];
  createdAt: number;
}
interface Event {
  id: number;
  title: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  ticketUrl: string;
  price: number;
  description: string;
}

let tipIdCounter = 1;
const fanTips: FanTip[] = [];

const partyRooms: Map<string, PartyRoom> = new Map();

const MUZE_EVENTS: Event[] = [
  { id: 1, title: "MUZE: Live Soul Sessions", venue: "The Fillmore", city: "San Francisco, CA", date: "2026-05-10", time: "8:00 PM", ticketUrl: "https://ticketmaster.com", price: 35, description: "An intimate live performance of soul, R&B, and neo-soul from the MUZE catalog." },
  { id: 2, title: "MUZE Gospel Sunday", venue: "Kingdom Arena", city: "Atlanta, GA", date: "2026-05-17", time: "3:00 PM", ticketUrl: "https://ticketmaster.com", price: 25, description: "Uplifting gospel and worship experience featuring the full MUZE Worship Collection." },
  { id: 3, title: "MUZE Trap Night", venue: "Terminal 5", city: "New York, NY", date: "2026-05-24", time: "10:00 PM", ticketUrl: "https://ticketmaster.com", price: 40, description: "High-energy trap and hip-hop showcase. 808s, live DJ, full production." },
  { id: 4, title: "MUZE Summer Festival", venue: "Bayfront Park", city: "Miami, FL", date: "2026-06-14", time: "4:00 PM", ticketUrl: "https://ticketmaster.com", price: 55, description: "Outdoor festival featuring MUZE across all genres — R&B, Afrobeats, Jazz, Neo Soul." },
  { id: 5, title: "MUZE Jazz & Chill", venue: "Blue Note", city: "Chicago, IL", date: "2026-06-21", time: "7:00 PM", ticketUrl: "https://ticketmaster.com", price: 30, description: "An elegant evening of jazz and lo-fi music in an intimate venue setting." },
  { id: 6, title: "MUZE Reggae Vibes", venue: "House of Blues", city: "Los Angeles, CA", date: "2026-07-04", time: "6:00 PM", ticketUrl: "https://ticketmaster.com", price: 35, description: "Celebrate Independence Day with MUZE Reggae and Afrobeats — positive vibes only." },
  { id: 7, title: "MUZE Wrapped Live", venue: "Paramount Theatre", city: "Seattle, WA", date: "2026-07-19", time: "8:00 PM", ticketUrl: "https://ticketmaster.com", price: 45, description: "See the most-played MUZE tracks performed live — the year's biggest hits on stage." },
  { id: 8, title: "MUZE Pop Night", venue: "Stubb's Waller Creek", city: "Austin, TX", date: "2026-08-08", time: "9:00 PM", ticketUrl: "https://ticketmaster.com", price: 38, description: "MUZE pop anthems, dance beats, and feel-good energy all night long." },
];

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Songs
  app.get("/api/songs", (req, res) => {
    const { genre, featured, search } = req.query as Record<string, string>;
    let result = storage.getAllSongs();
    if (search) result = storage.searchSongs(search);
    if (genre) result = result.filter(s => s.genre === genre);
    if (featured === "true") result = result.filter(s => s.featured);
    res.json(result);
  });

  app.get("/api/songs/:id", (req, res) => {
    const song = storage.getSongById(Number(req.params.id));
    if (!song) return res.status(404).json({ message: "Song not found" });
    res.json(song);
  });

  app.post("/api/songs", (req, res) => {
    const parsed = insertSongSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(storage.createSong(parsed.data));
  });

  app.patch("/api/songs/:id", (req, res) => {
    const song = storage.updateSong(Number(req.params.id), req.body);
    if (!song) return res.status(404).json({ message: "Not found" });
    res.json(song);
  });

  app.post("/api/songs/:id/play", (req, res) => {
    const id = Number(req.params.id);
    storage.incrementPlayCount(id);
    storage.addHistory(id);
    res.json({ success: true });
  });

  app.get("/api/genres", (req, res) => {
    const genres = [...new Set(storage.getAllSongs().map(s => s.genre))];
    res.json(genres);
  });

  // Albums
  app.get("/api/albums", (req, res) => {
    const all = storage.getAllSongs();
    const albumMap: Record<string, { name: string; genre: string; artist: string; year: number | null; songs: typeof all }> = {};
    for (const song of all) {
      const album = song.album || "Singles";
      if (!albumMap[album]) albumMap[album] = { name: album, genre: song.genre, artist: song.artist, year: song.releaseYear, songs: [] };
      albumMap[album].songs.push(song);
    }
    res.json(Object.values(albumMap));
  });

  // Playlists
  app.get("/api/playlists", (req, res) => res.json(storage.getAllPlaylists()));

  app.get("/api/playlists/:id", (req, res) => {
    const playlist = storage.getPlaylistById(Number(req.params.id));
    if (!playlist) return res.status(404).json({ message: "Not found" });
    const songIds: number[] = JSON.parse(playlist.songIds || "[]");
    const pSongs = songIds.map(id => storage.getSongById(id)).filter(Boolean);
    res.json({ ...playlist, songs: pSongs });
  });

  app.post("/api/playlists", (req, res) => {
    const parsed = insertPlaylistSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(storage.createPlaylist(parsed.data));
  });

  app.patch("/api/playlists/:id", (req, res) => {
    const p = storage.updatePlaylist(Number(req.params.id), req.body);
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json(p);
  });

  app.delete("/api/playlists/:id", (req, res) => {
    storage.deletePlaylist(Number(req.params.id));
    res.json({ success: true });
  });

  // Likes
  app.get("/api/likes", (req, res) => {
    const liked = storage.getLikedSongs();
    const songs = liked.map(l => ({ ...storage.getSongById(l.songId), likedAt: l.likedAt })).filter(s => s.id);
    res.json(songs);
  });

  app.get("/api/likes/:songId", (req, res) => {
    res.json({ liked: storage.isSongLiked(Number(req.params.songId)) });
  });

  app.post("/api/likes/:songId", (req, res) => {
    const id = Number(req.params.songId);
    if (storage.isSongLiked(id)) return res.json({ liked: true });
    storage.likeSong(id);
    res.json({ liked: true });
  });

  app.delete("/api/likes/:songId", (req, res) => {
    storage.unlikeSong(Number(req.params.songId));
    res.json({ liked: false });
  });

  // History
  app.get("/api/history", (req, res) => {
    const limit = Number(req.query.limit) || 20;
    const history = storage.getHistory(limit);
    const songs = history.map(h => ({ ...storage.getSongById(h.songId), playedAt: h.playedAt })).filter(s => s.id);
    res.json(songs);
  });

  // Orders
  app.post("/api/orders", (req, res) => {
    const parsed = insertOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.status(201).json(storage.createOrder(parsed.data));
  });

  app.get("/api/orders", (req, res) => res.json(storage.getAllOrders()));

  // ─── FAN TIPS ────────────────────────────────────────────────────────────────
  app.get("/api/tips", (req, res) => {
    res.json(fanTips);
  });

  app.post("/api/tips", (req, res) => {
    const { songId, fromName, fromEmail, amount, message } = req.body;
    if (!fromName || !fromEmail || !amount) {
      return res.status(400).json({ message: "fromName, fromEmail, and amount are required" });
    }
    const tip: FanTip = {
      id: tipIdCounter++,
      songId: songId || null,
      fromName,
      fromEmail,
      amount: Number(amount),
      message: message || "",
      createdAt: Date.now(),
    };
    fanTips.push(tip);
    res.status(201).json(tip);
  });

  // ─── EVENTS ──────────────────────────────────────────────────────────────────
  app.get("/api/events", (req, res) => {
    res.json(MUZE_EVENTS);
  });

  // ─── STATS / MUZE WRAPPED ────────────────────────────────────────────────────
  app.get("/api/stats", (req, res) => {
    const allSongs = storage.getAllSongs();
    const history = storage.getHistory(500);

    // Play counts per song
    const playCounts: Record<number, number> = {};
    for (const h of history) {
      playCounts[h.songId] = (playCounts[h.songId] || 0) + 1;
    }

    // Top songs
    const topSongs = allSongs
      .filter(s => (playCounts[s.id] || 0) > 0)
      .sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0))
      .slice(0, 5)
      .map(s => ({ ...s, plays: playCounts[s.id] || 0 }));

    // Genre breakdown
    const genreCounts: Record<string, number> = {};
    for (const h of history) {
      const song = allSongs.find(s => s.id === h.songId);
      if (song) genreCounts[song.genre] = (genreCounts[song.genre] || 0) + 1;
    }
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));

    // Total minutes listened
    const totalSeconds = history.reduce((acc, h) => {
      const song = allSongs.find(s => s.id === h.songId);
      return acc + (song?.duration || 0);
    }, 0);

    // Most liked genre
    const liked = storage.getLikedSongs();
    const likedGenreCounts: Record<string, number> = {};
    for (const l of liked) {
      const song = allSongs.find(s => s.id === l.songId);
      if (song) likedGenreCounts[song.genre] = (likedGenreCounts[song.genre] || 0) + 1;
    }
    const topLikedGenre = Object.entries(likedGenreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({
      totalPlays: history.length,
      totalMinutes: Math.round(totalSeconds / 60),
      totalLikes: liked.length,
      topSongs,
      topGenres,
      topLikedGenre,
      uniqueArtists: [...new Set(allSongs.map(s => s.artist))].length,
    });
  });

  // ─── SMART PLAYLISTS ─────────────────────────────────────────────────────────
  app.get("/api/smart-playlists", (req, res) => {
    const allSongs = storage.getAllSongs();
    const history = storage.getHistory(200);
    const liked = storage.getLikedSongs();
    const likedIds = new Set(liked.map(l => l.songId));

    // Play counts
    const playCounts: Record<number, number> = {};
    for (const h of history) playCounts[h.songId] = (playCounts[h.songId] || 0) + 1;

    const smartPlaylists = [
      {
        id: "most-played",
        name: "Most Played",
        description: "Your top tracks by play count",
        emoji: "🔥",
        songs: [...allSongs].sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0)).slice(0, 12),
      },
      {
        id: "liked",
        name: "Favorites",
        description: "Songs you've hearted",
        emoji: "❤️",
        songs: allSongs.filter(s => likedIds.has(s.id)),
      },
      {
        id: "newest",
        name: "Latest Additions",
        description: "Freshest tracks in the catalog",
        emoji: "✨",
        songs: [...allSongs].sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0)).slice(0, 12),
      },
      {
        id: "high-bpm",
        name: "High Energy",
        description: "Fast BPM tracks for workouts",
        emoji: "⚡",
        songs: allSongs.filter(s => (s.bpm || 0) >= 120).sort((a, b) => (b.bpm || 0) - (a.bpm || 0)),
      },
      {
        id: "chill",
        name: "Chill Vibes",
        description: "Slow BPM for relaxing",
        emoji: "🌙",
        songs: allSongs.filter(s => (s.bpm || 0) > 0 && (s.bpm || 0) < 90).sort((a, b) => (a.bpm || 0) - (b.bpm || 0)),
      },
      {
        id: "gospel-worship",
        name: "Praise & Worship",
        description: "Gospel and Christian music",
        emoji: "🙏",
        songs: allSongs.filter(s => s.genre === "Gospel" || s.genre === "Christian/Worship"),
      },
      {
        id: "rb-soul",
        name: "R&B / Soul Mix",
        description: "R&B, Neo Soul, and Soul tracks",
        emoji: "🎵",
        songs: allSongs.filter(s => ["R&B", "Neo Soul", "Soul"].includes(s.genre)),
      },
      {
        id: "hip-hop-trap",
        name: "Hip-Hop / Trap",
        description: "Hip-Hop, Trap, and Drill",
        emoji: "🎤",
        songs: allSongs.filter(s => ["Hip-Hop", "Trap", "Drill"].includes(s.genre)),
      },
    ];

    res.json(smartPlaylists);
  });

  // ─── LYRICS SEARCH ───────────────────────────────────────────────────────────
  app.get("/api/lyrics-search", (req, res) => {
    const { q } = req.query as Record<string, string>;
    if (!q || q.trim().length < 2) return res.json([]);
    const query = q.toLowerCase().trim();
    const allSongs = storage.getAllSongs();
    const results = allSongs
      .filter(s => s.lyrics && s.lyrics.toLowerCase().includes(query))
      .map(s => {
        const lyrics = s.lyrics || "";
        const idx = lyrics.toLowerCase().indexOf(query);
        const start = Math.max(0, idx - 40);
        const end = Math.min(lyrics.length, idx + query.length + 60);
        const snippet = (start > 0 ? "…" : "") + lyrics.slice(start, end) + (end < lyrics.length ? "…" : "");
        return { ...s, matchSnippet: snippet };
      });
    res.json(results);
  });

  // ─── LISTENING PARTY ROOMS ───────────────────────────────────────────────────
  app.get("/api/party/rooms", (req, res) => {
    res.json([...partyRooms.values()].filter(r => r.listeners.length > 0 || Date.now() - r.createdAt < 3600000));
  });

  app.post("/api/party/rooms", (req, res) => {
    const { name, hostName } = req.body;
    if (!name || !hostName) return res.status(400).json({ message: "name and hostName required" });
    const id = Math.random().toString(36).slice(2, 8).toUpperCase();
    const room: PartyRoom = {
      id,
      name,
      hostName,
      currentSongId: null,
      currentTime: 0,
      isPlaying: false,
      queue: [],
      listeners: [hostName],
      createdAt: Date.now(),
    };
    partyRooms.set(id, room);
    res.status(201).json(room);
  });

  app.get("/api/party/rooms/:id", (req, res) => {
    const room = partyRooms.get(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  app.patch("/api/party/rooms/:id", (req, res) => {
    const room = partyRooms.get(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    Object.assign(room, req.body);
    partyRooms.set(req.params.id, room);
    res.json(room);
  });

  app.post("/api/party/rooms/:id/join", (req, res) => {
    const room = partyRooms.get(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const { name } = req.body;
    if (name && !room.listeners.includes(name)) room.listeners.push(name);
    partyRooms.set(req.params.id, room);
    res.json(room);
  });

  // ─── PAYMENT ROUTES ────────────────────────────────────────────────────────────

  /**
   * POST /api/payments
   * Creates a payment intent. Returns the payment record with the MUZE payment
   * handle ($cashtag or Zelle email) so the user knows where to send money.
   * The payment stays in "pending" until the user confirms they sent it.
   */
  app.post("/api/payments", (req, res) => {
    const ip = getClientIp(req);
    const ua = req.headers["user-agent"] || "";

    // Rate limit: max 10 payment attempts per IP per hour
    const ipAllowed = storage.checkRateLimit(`pay:ip:${ip}`, 10, 60 * 60 * 1000);
    if (!ipAllowed) {
      return res.status(429).json({ message: "Too many payment attempts. Please try again later." });
    }

    // Validate body
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid request", errors: parsed.error.flatten().fieldErrors });
    }

    const data = parsed.data;

    // Rate limit: max 5 attempts per email per hour
    const emailAllowed = storage.checkRateLimit(`pay:email:${data.buyerEmail}`, 5, 60 * 60 * 1000);
    if (!emailAllowed) {
      return res.status(429).json({ message: "Too many payment attempts from this email. Please wait an hour." });
    }

    // Verify song/album price if itemType is song or album
    if (data.itemType === "song" && data.itemId) {
      const song = storage.getSongById(Number(data.itemId));
      if (song && Math.abs(song.price - data.grossAmount) > 0.01) {
        return res.status(400).json({ message: "Amount mismatch. Please refresh and try again." });
      }
    }

    const payment = storage.createPayment({
      ...data,
      ipAddress: ip,
      userAgent: ua,
    });

    // Return payment with handle — client shows "send $X to $MUZEmusic"
    res.status(201).json({
      id: payment.id,
      token: payment.confirmationToken,
      paymentMethod: payment.paymentMethod,
      paymentHandle: payment.paymentHandle,
      grossAmount: payment.grossAmount,
      muzeSplit: payment.muzeSplit,
      artistSplit: payment.artistSplit,
      status: payment.status,
      itemTitle: payment.itemTitle,
      isGift: payment.isGift,
    });
  });

  /**
   * POST /api/payments/:token/confirm
   * User taps "I've sent the payment" — marks it confirmed.
   * In production you'd verify this via Cash App/Zelle webhook.
   */
  app.post("/api/payments/:token/confirm", (req, res) => {
    const { token } = req.params;
    if (!token || token.length !== 64) {
      return res.status(400).json({ message: "Invalid token" });
    }
    const payment = storage.getPaymentByToken(token);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.status === "confirmed") return res.json({ ...payment, alreadyConfirmed: true });
    if (payment.status === "failed") return res.status(400).json({ message: "Payment was already cancelled" });

    const confirmed = storage.confirmPayment(token);
    res.json(confirmed);
  });

  /**
   * POST /api/payments/:token/cancel
   * User cancels before sending.
   */
  app.post("/api/payments/:token/cancel", (req, res) => {
    const { token } = req.params;
    if (!token || token.length !== 64) {
      return res.status(400).json({ message: "Invalid token" });
    }
    const payment = storage.getPaymentByToken(token);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    storage.failPayment(token);
    res.json({ success: true });
  });

  /**
   * GET /api/payments/:token
   * Check payment status by token.
   */
  app.get("/api/payments/:token", (req, res) => {
    const { token } = req.params;
    if (!token || token.length !== 64) {
      return res.status(400).json({ message: "Invalid token" });
    }
    const payment = storage.getPaymentByToken(token);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    // Return safe subset (no IP/UA)
    res.json({
      id: payment.id,
      itemTitle: payment.itemTitle,
      itemType: payment.itemType,
      grossAmount: payment.grossAmount,
      muzeSplit: payment.muzeSplit,
      artistSplit: payment.artistSplit,
      paymentMethod: payment.paymentMethod,
      paymentHandle: payment.paymentHandle,
      status: payment.status,
      isGift: payment.isGift,
      createdAt: payment.createdAt,
      confirmedAt: payment.confirmedAt,
    });
  });

  /**
   * GET /api/payments/stats (admin)
   * Earnings summary — 40/60 split totals.
   */
  app.get("/api/payments/stats", (req, res) => {
    res.json(storage.getPaymentStats());
  });

  /**
   * GET /api/payments (admin — all payments)
   */
  app.get("/api/payments", (req, res) => {
    const all = storage.getAllPayments().map(p => ({
      id: p.id,
      itemTitle: p.itemTitle,
      itemType: p.itemType,
      buyerName: p.buyerName,
      buyerEmail: p.buyerEmail,
      grossAmount: p.grossAmount,
      muzeSplit: p.muzeSplit,
      artistSplit: p.artistSplit,
      paymentMethod: p.paymentMethod,
      status: p.status,
      isGift: p.isGift,
      createdAt: p.createdAt,
    }));
    res.json(all);
  });


  // ─────────────────────────────────────────────────────────────────────────
  // ARTIST AUTH ROUTES
  // ─────────────────────────────────────────────────────────────────────────
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");
  const nodemailer = require("nodemailer");
  const cryptoAuth = require("crypto");

  const JWT_SECRET = process.env.JWT_SECRET || "muze-super-secret-jwt-2026-do-not-expose";
  const APP_URL = process.env.APP_URL || "http://localhost:5000";
  const SALT_ROUNDS = 12;
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes
  const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
  const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
  const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  // Nodemailer transporter — uses Ethereal (test) in dev, real SMTP from env in prod
  async function getMailer() {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }
    // Ethereal test account — emails visible at https://ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransporter({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  async function sendVerificationEmail(toEmail: string, name: string, token: string) {
    try {
      const mailer = await getMailer();
      const link = `${APP_URL}/#/verify-email?token=${token}`;
      const info = await mailer.sendMail({
        from: '"MUZE" <noreply@muze.music>',
        to: toEmail,
        subject: "Verify your MUZE artist account",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:12px">
            <h2 style="color:#a855f7;margin-top:0">Welcome to MUZE, ${name}!</h2>
            <p>Click below to verify your email and activate your artist account.</p>
            <a href="${link}" style="display:inline-block;background:#a855f7;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
              Verify My Email
            </a>
            <p style="color:#888;font-size:13px">This link expires in 24 hours.<br>If you didn't create a MUZE account, ignore this email.</p>
          </div>`,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log("[MUZE Auth] Verification email preview:", previewUrl);
    } catch (err) {
      console.error("[MUZE Auth] Failed to send verification email:", err);
    }
  }

  async function sendPasswordResetEmail(toEmail: string, name: string, token: string) {
    try {
      const mailer = await getMailer();
      const link = `${APP_URL}/#/reset-password?token=${token}`;
      const info = await mailer.sendMail({
        from: '"MUZE" <noreply@muze.music>',
        to: toEmail,
        subject: "Reset your MUZE password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:12px">
            <h2 style="color:#a855f7;margin-top:0">Password Reset</h2>
            <p>Hi ${name}, you passed your security questions. Click below to set a new password.</p>
            <a href="${link}" style="display:inline-block;background:#a855f7;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
              Reset My Password
            </a>
            <p style="color:#888;font-size:13px">This link expires in 1 hour.<br>If you didn't request a reset, your account is safe — ignore this email.</p>
          </div>`,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log("[MUZE Auth] Password reset email preview:", previewUrl);
    } catch (err) {
      console.error("[MUZE Auth] Failed to send reset email:", err);
    }
  }

  // Zod schemas for auth
  const registerSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
    phone: z.string().min(7).max(20),
    sq1: z.string().min(1), sa1: z.string().min(2),
    sq2: z.string().min(1), sa2: z.string().min(2),
    sq3: z.string().min(1), sa3: z.string().min(2),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  const forgotPasswordSchema = z.object({
    email: z.string().email(),
  });

  const verifySecuritySchema = z.object({
    email: z.string().email(),
    sa1: z.string().min(1),
    sa2: z.string().min(1),
    sa3: z.string().min(1),
  });

  const resetPasswordSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string()
      .min(8)
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
  });

  // ── POST /api/auth/register ──────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    const ip = getClientIp(req);
    if (!storage.checkRateLimit(`register:${ip}`, 5, AUTH_RATE_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many registration attempts. Try again in 15 minutes." });
    }
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
    }
    const d = parsed.data;
    // Check duplicate email
    const existing = storage.getArtistByEmail(d.email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    // Hash password + all 3 security answers
    const passwordHash = await bcrypt.hash(d.password, SALT_ROUNDS);
    const ha1 = await bcrypt.hash(d.sa1.toLowerCase().trim(), SALT_ROUNDS);
    const ha2 = await bcrypt.hash(d.sa2.toLowerCase().trim(), SALT_ROUNDS);
    const ha3 = await bcrypt.hash(d.sa3.toLowerCase().trim(), SALT_ROUNDS);
    // Generate email verification token
    const verificationToken = cryptoAuth.randomBytes(32).toString("hex");
    const verificationExpiry = Date.now() + VERIFY_TOKEN_EXPIRY_MS;
    const artist = storage.createArtist({
      name: d.name, email: d.email, passwordHash, phone: d.phone,
      verificationToken, verificationExpiry,
      sq1: d.sq1, sa1: ha1,
      sq2: d.sq2, sa2: ha2,
      sq3: d.sq3, sa3: ha3,
    });
    // Send verification email (async — do not await to avoid blocking response)
    sendVerificationEmail(artist.email, artist.name, verificationToken);
    return res.status(201).json({
      message: "Account created! Check your email to verify your account.",
      artistId: artist.id,
    });
  });

  // ── GET /api/auth/verify-email?token= ───────────────────────────────────
  app.get("/api/auth/verify-email", (req, res) => {
    const { token } = req.query as { token?: string };
    if (!token) return res.status(400).json({ error: "Missing token." });
    const artist = storage.getArtistByVerificationToken(token);
    if (!artist) return res.status(400).json({ error: "Invalid or already-used verification link." });
    const now = Date.now();
    if (artist.verificationExpiry && now > artist.verificationExpiry) {
      return res.status(410).json({ error: "Verification link expired. Please register again." });
    }
    storage.verifyArtistEmail(artist.id);
    return res.json({ message: "Email verified! You can now log in.", artistId: artist.id });
  });

  // ── POST /api/auth/login ─────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    const ip = getClientIp(req);
    if (!storage.checkRateLimit(`login:${ip}`, 10, AUTH_RATE_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many login attempts. Try again in 15 minutes." });
    }
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid email or password." });
    const { email, password } = parsed.data;
    const artist = storage.getArtistByEmail(email);
    // Always run bcrypt even if no user — prevents timing attacks revealing whether account exists
    const dummyHash = "$2a$12$invalidhashfortimingnormalization000000000000000000000";
    const passwordToCheck = artist?.passwordHash || dummyHash;
    const passwordValid = await bcrypt.compare(password, passwordToCheck);
    if (!artist || !passwordValid) {
      if (artist) {
        const attempts = (artist.loginAttempts || 0) + 1;
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
          storage.updateLoginAttempts(artist.id, attempts, Date.now() + LOCKOUT_MS);
          return res.status(401).json({
            error: `Too many failed attempts. Account locked for 30 minutes.`,
          });
        }
        storage.updateLoginAttempts(artist.id, attempts);
      }
      return res.status(401).json({ error: "Invalid email or password." });
    }
    // Check lockout
    if (artist.lockedUntil && Date.now() < artist.lockedUntil) {
      const minutesLeft = Math.ceil((artist.lockedUntil - Date.now()) / 60000);
      return res.status(403).json({ error: `Account locked. Try again in ${minutesLeft} minute(s).` });
    }
    if (!artist.isVerified) {
      return res.status(403).json({
        error: "Please verify your email before logging in.",
        needsVerification: true,
      });
    }
    storage.updateLastLogin(artist.id);
    const token = jwt.sign({ sub: artist.id, email: artist.email, name: artist.name }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      token,
      artist: { id: artist.id, name: artist.name, email: artist.email, phone: artist.phone },
    });
  });

  // ── GET /api/auth/me ─────────────────────────────────────────────────────
  app.get("/api/auth/me", (req, res) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated." });
    try {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET) as any;
      const artist = storage.getArtistById(payload.sub);
      if (!artist) return res.status(404).json({ error: "Artist not found." });
      return res.json({ id: artist.id, name: artist.name, email: artist.email, phone: artist.phone, isVerified: artist.isVerified });
    } catch {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  });

  // ── POST /api/auth/forgot-password ─ Step 1: look up account ────────────
  app.post("/api/auth/forgot-password", (req, res) => {
    const ip = getClientIp(req);
    if (!storage.checkRateLimit(`forgot:${ip}`, 5, AUTH_RATE_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many attempts. Try again later." });
    }
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Valid email required." });
    const artist = storage.getArtistByEmail(parsed.data.email);
    // Always return the security questions regardless — prevents email enumeration
    const defaultQuestions = [
      "What was the name of your childhood pet?",
      "What was the name of your first school?",
      "What city did you grow up in?",
    ];
    if (!artist) {
      return res.json({
        found: false,
        questions: defaultQuestions,
        message: "If that email exists, please answer the security questions.",
      });
    }
    return res.json({
      found: true,
      questions: [artist.sq1, artist.sq2, artist.sq3],
      message: "Answer all 3 security questions to continue.",
    });
  });

  // ── POST /api/auth/verify-security ─ Step 2: check answers ──────────────
  app.post("/api/auth/verify-security", async (req, res) => {
    const ip = getClientIp(req);
    if (!storage.checkRateLimit(`security:${ip}`, 5, AUTH_RATE_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many attempts. Try again later." });
    }
    const parsed = verifySecuritySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "All 3 answers required." });
    const { email, sa1, sa2, sa3 } = parsed.data;
    const artist = storage.getArtistByEmail(email);
    if (!artist) return res.status(400).json({ error: "Invalid request." });
    // Check all 3 answers (must pass at least 2 of 3 to resist forgetting one)
    const [ok1, ok2, ok3] = await Promise.all([
      bcrypt.compare(sa1.toLowerCase().trim(), artist.sa1),
      bcrypt.compare(sa2.toLowerCase().trim(), artist.sa2),
      bcrypt.compare(sa3.toLowerCase().trim(), artist.sa3),
    ]);
    const passedCount = [ok1, ok2, ok3].filter(Boolean).length;
    if (passedCount < 2) {
      return res.status(401).json({ error: "Security answers incorrect. Try again." });
    }
    // Generate reset token and send email
    const resetToken = cryptoAuth.randomBytes(32).toString("hex");
    const resetExpiry = Date.now() + RESET_TOKEN_EXPIRY_MS;
    storage.setResetToken(artist.id, resetToken, resetExpiry);
    sendPasswordResetEmail(artist.email, artist.name, resetToken);
    return res.json({ message: "Security questions passed! Check your email for a reset link." });
  });

  // ── POST /api/auth/reset-password ─ Step 3: set new password ────────────
  app.post("/api/auth/reset-password", async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input." });
    }
    const { token, newPassword } = parsed.data;
    const artist = storage.getArtistByResetToken(token);
    if (!artist) return res.status(400).json({ error: "Invalid or expired reset link." });
    if (!artist.resetExpiry || Date.now() > artist.resetExpiry) {
      storage.clearResetToken(artist.id);
      return res.status(410).json({ error: "Reset link expired. Please start the forgot-password process again." });
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    storage.updatePassword(artist.id, passwordHash);
    return res.json({ message: "Password updated successfully! You can now log in." });
  });

  // ── GET /api/auth/security-questions?email= ─────────────────────────────
  // Returns question TEXTS (not answers) so the frontend can display them
  app.get("/api/auth/security-questions", (req, res) => {
    const { email } = req.query as { email?: string };
    if (!email) return res.status(400).json({ error: "Email required." });
    const artist = storage.getArtistByEmail(email);
    if (!artist) return res.json({ questions: [] }); // silent
    return res.json({ questions: [artist.sq1, artist.sq2, artist.sq3] });
  });

  // ── POST /api/auth/resend-verification ──────────────────────────────────────
  // Since no real SMTP is configured, we auto-verify the account immediately.
  // This is the "Activate My Account" button on LoginPage.
  app.post("/api/auth/resend-verification", (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email required." });
    }
    const artist = storage.getArtistByEmail(email.toLowerCase().trim());
    if (!artist) {
      // Return success anyway to prevent email enumeration
      return res.json({ message: "If that account exists, it is now activated." });
    }
    if (artist.isVerified) {
      return res.json({ message: "Account already verified — go ahead and sign in!" });
    }
    // Auto-verify the account
    storage.verifyArtistEmail(artist.id);
    return res.json({ message: "Account activated! You can now sign in." });
  });

  // ──────────────────────────────────────────────────────────────────────
  // ADMIN ROUTES  (protected by JWT + admin email whitelist)
  // ──────────────────────────────────────────────────────────────────────
  const ADMIN_EMAILS = ["sheldoncooper601@gmail.com", "sheldoncooper601@yahoo.com"];

  function requireAdmin(req: any, res: any, next: () => void) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated." });
    try {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET) as any;
      if (!ADMIN_EMAILS.includes((payload.email || "").toLowerCase())) {
        return res.status(403).json({ error: "Admin access required." });
      }
      req.adminPayload = payload;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  }

  // GET /api/admin/dashboard — overview stats
  app.get("/api/admin/dashboard", requireAdmin, (req, res) => {
    const allSongs = storage.getAllSongs();
    const allArtists = storage.getAllArtists();
    const allPayments = storage.getAllPayments();
    const history = storage.getHistory(1000);
    const stats = storage.getPaymentStats();

    const totalRevenue = allPayments.filter(p => p.status === "confirmed").reduce((s, p) => s + p.grossAmount, 0);
    const pendingPayments = allPayments.filter(p => p.status === "pending").length;
    const confirmedPayments = allPayments.filter(p => p.status === "confirmed").length;

    // Genre breakdown
    const genreCounts: Record<string, number> = {};
    for (const h of history) {
      const song = allSongs.find(s => s.id === h.songId);
      if (song) genreCounts[song.genre] = (genreCounts[song.genre] || 0) + 1;
    }
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));

    // Top songs by play count
    const topSongs = [...allSongs]
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 5);

    res.json({
      totalSongs: allSongs.length,
      totalArtists: allArtists.length,
      totalPlays: history.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      muzeSplit: parseFloat((totalRevenue * 0.4).toFixed(2)),
      artistSplit: parseFloat((totalRevenue * 0.6).toFixed(2)),
      pendingPayments,
      confirmedPayments,
      topGenres,
      topSongs,
      paymentStats: stats,
    });
  });

  // GET /api/admin/artists — all artist accounts
  app.get("/api/admin/artists", requireAdmin, (req, res) => {
    const allArtists = storage.getAllArtists();
    // Strip sensitive fields
    const safe = allArtists.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      isVerified: a.isVerified,
      loginAttempts: a.loginAttempts,
      lockedUntil: a.lockedUntil,
      lastLogin: a.lastLogin,
      createdAt: a.createdAt,
    }));
    res.json(safe);
  });

  // PATCH /api/admin/artists/:id — update artist (verify, unlock, etc.)
  app.patch("/api/admin/artists/:id", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const artist = storage.getArtistById(id);
    if (!artist) return res.status(404).json({ error: "Artist not found." });
    const { action } = req.body;
    if (action === "verify") {
      storage.verifyArtistEmail(id);
      return res.json({ message: "Artist email verified." });
    }
    if (action === "unlock") {
      storage.updateLoginAttempts(id, 0, undefined);
      return res.json({ message: "Artist account unlocked." });
    }
    if (action === "delete") {
      storage.deleteArtist(id);
      return res.json({ message: "Artist deleted." });
    }
    return res.status(400).json({ error: "Unknown action." });
  });

  // GET /api/admin/payments — all payments with full detail
  app.get("/api/admin/payments", requireAdmin, (req, res) => {
    const all = storage.getAllPayments();
    res.json(all);
  });

  // PATCH /api/admin/payments/:id — confirm/reject a payment
  app.patch("/api/admin/payments/:id", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!status || !["confirmed", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Status must be confirmed, rejected, or pending." });
    }
    const payment = storage.updatePaymentStatus(id, status);
    if (!payment) return res.status(404).json({ error: "Payment not found." });
    res.json({ message: `Payment ${status}.`, payment });
  });

  // GET /api/admin/songs — all songs with full data
  app.get("/api/admin/songs", requireAdmin, (req, res) => {
    res.json(storage.getAllSongs());
  });

  // POST /api/admin/songs — add a new song
  app.post("/api/admin/songs", requireAdmin, (req, res) => {
    const parsed = insertSongSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
    const song = storage.createSong(parsed.data);
    res.status(201).json(song);
  });

  // PATCH /api/admin/songs/:id — edit a song
  app.patch("/api/admin/songs/:id", requireAdmin, (req, res) => {
    const song = storage.updateSong(Number(req.params.id), req.body);
    if (!song) return res.status(404).json({ error: "Song not found." });
    res.json(song);
  });

  // DELETE /api/admin/songs/:id
  app.delete("/api/admin/songs/:id", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const song = storage.getSongById(id);
    if (!song) return res.status(404).json({ error: "Song not found." });
    storage.deleteSong(id);
    res.json({ message: "Song deleted." });
  });

  // GET /api/admin/export — full data export (for MUZE_MASTER updates)
  app.get("/api/admin/export", requireAdmin, (req, res) => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      songs: storage.getAllSongs(),
      artists: storage.getAllArtists().map(a => ({
        id: a.id, name: a.name, email: a.email, isVerified: a.isVerified, createdAt: a.createdAt
      })),
      payments: storage.getAllPayments(),
      paymentStats: storage.getPaymentStats(),
      history: storage.getHistory(500),
    };
    res.setHeader("Content-Disposition", `attachment; filename=muze-export-${Date.now()}.json`);
    res.setHeader("Content-Type", "application/json");
    res.json(exportData);
  });


  return httpServer;
}
