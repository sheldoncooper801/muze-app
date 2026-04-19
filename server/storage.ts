import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { songs, playlists, likedSongs, listeningHistory, orders, payments, rateLimits, artists } from "@shared/schema";
import type { Song, InsertSong, Playlist, InsertPlaylist, LikedSong, ListeningHistory, Order, InsertOrder, Payment, Artist } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const sqlite = new Database("muze.db");
export const db = drizzle(sqlite);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL DEFAULT 'MUZE',
    album TEXT,
    genre TEXT NOT NULL DEFAULT 'R&B',
    duration INTEGER NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 1.99,
    cover_url TEXT,
    audio_url TEXT,
    description TEXT,
    lyrics TEXT,
    release_year INTEGER,
    featured INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    bpm INTEGER,
    key_signature TEXT
  );
  CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    song_ids TEXT NOT NULL DEFAULT '[]',
    is_system INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS liked_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER NOT NULL,
    liked_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS listening_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER NOT NULL,
    played_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_name TEXT,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL,
    item_id TEXT,
    item_title TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    recipient_name TEXT,
    recipient_email TEXT,
    gift_message TEXT,
    is_gift INTEGER DEFAULT 0,
    gross_amount REAL NOT NULL,
    muze_split REAL NOT NULL,
    artist_split REAL NOT NULL,
    payment_method TEXT NOT NULL,
    payment_handle TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    confirmation_token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER,
    confirmed_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    hits INTEGER NOT NULL DEFAULT 1,
    window_start INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    verification_expiry INTEGER,
    sq1 TEXT NOT NULL,
    sa1 TEXT NOT NULL,
    sq2 TEXT NOT NULL,
    sa2 TEXT NOT NULL,
    sq3 TEXT NOT NULL,
    sa3 TEXT NOT NULL,
    reset_token TEXT,
    reset_expiry INTEGER,
    reset_verified INTEGER DEFAULT 0,
    created_at INTEGER,
    last_login INTEGER,
    login_attempts INTEGER DEFAULT 0,
    locked_until INTEGER
  );
`);

try { sqlite.exec(`ALTER TABLE songs ADD COLUMN lyrics TEXT`); } catch {}
try { sqlite.exec(`ALTER TABLE songs ADD COLUMN bpm INTEGER`); } catch {}
try { sqlite.exec(`ALTER TABLE songs ADD COLUMN key_signature TEXT`); } catch {}
try { sqlite.exec(`ALTER TABLE playlists ADD COLUMN is_system INTEGER DEFAULT 0`); } catch {}
try { sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(buyer_email)`); } catch {}
try { sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`); } catch {}
try { sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key)`); } catch {}
try { sqlite.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_email ON artists(email)`); } catch {}
try { sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_artists_verification_token ON artists(verification_token)`); } catch {}
try { sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_artists_reset_token ON artists(reset_token)`); } catch {}

export interface IStorage {
  getAllSongs(): Song[];
  getSongById(id: number): Song | undefined;
  getFeaturedSongs(): Song[];
  searchSongs(query: string): Song[];
  createSong(song: InsertSong): Song;
  updateSong(id: number, data: Partial<InsertSong>): Song | undefined;
  incrementPlayCount(id: number): void;
  getAllPlaylists(): Playlist[];
  getPlaylistById(id: number): Playlist | undefined;
  createPlaylist(data: InsertPlaylist): Playlist;
  updatePlaylist(id: number, data: Partial<InsertPlaylist>): Playlist | undefined;
  deletePlaylist(id: number): void;
  getLikedSongs(): LikedSong[];
  likeSong(songId: number): LikedSong;
  unlikeSong(songId: number): void;
  isSongLiked(songId: number): boolean;
  getHistory(limit?: number): ListeningHistory[];
  addHistory(songId: number): void;
  createOrder(order: InsertOrder): Order;
  getAllOrders(): Order[];
  // Payment methods
  createPayment(data: {
    itemType: string; itemId?: string; itemTitle: string;
    buyerName: string; buyerEmail: string;
    recipientName?: string; recipientEmail?: string; giftMessage?: string; isGift?: boolean;
    grossAmount: number; paymentMethod: string; paymentHandle?: string;
    ipAddress?: string; userAgent?: string;
  }): Payment;
  getPaymentByToken(token: string): Payment | undefined;
  confirmPayment(token: string): Payment | undefined;
  failPayment(token: string): void;
  getAllPayments(): Payment[];
  getPaymentStats(): { totalRevenue: number; muzeTake: number; artistTake: number; totalCount: number; pendingCount: number };
  // Admin methods
  deleteSong(id: number): void;
  updatePaymentStatus(id: number, status: string): Payment | undefined;
  getAllArtists(): Artist[];
  deleteArtist(id: number): void;
  // Rate limiting
  checkRateLimit(key: string, maxHits: number, windowMs: number): boolean;
  // Artist auth
  createArtist(data: {
    name: string; email: string; passwordHash: string; phone: string;
    verificationToken: string; verificationExpiry: number;
    sq1: string; sa1: string; sq2: string; sa2: string; sq3: string; sa3: string;
  }): Artist;
  getArtistByEmail(email: string): Artist | undefined;
  getArtistById(id: number): Artist | undefined;
  getArtistByVerificationToken(token: string): Artist | undefined;
  verifyArtistEmail(id: number): void;
  updateLoginAttempts(id: number, attempts: number, lockedUntil?: number): void;
  updateLastLogin(id: number): void;
  setResetToken(id: number, token: string, expiry: number): void;
  markResetVerified(id: number): void;
  updatePassword(id: number, passwordHash: string): void;
  getArtistByResetToken(token: string): Artist | undefined;
  clearResetToken(id: number): void;
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const SEED_SONGS: InsertSong[] = [
  // R&B
  {
    title: "If We Never Happened", artist: "MUZE", album: "Late Night Sessions", genre: "R&B",
    duration: 247, price: 1.99, releaseYear: 2026, featured: true, bpm: 72, keySignature: "F# minor",
    description: "A slow, emotional R&B track about love and loss — big 808s, soulful vocals.",
    lyrics: `[Intro]\nYeah…\nSometimes I wonder… what it would be like…\n\n[Verse 1]\nIf we never crossed that night\nWould I still be sleepin' right?\nWould my heart still feel untouched\nNot knowin' what we was\n\nNo late calls at 2AM\nNo "I miss you," no pretend\nNo memories stuck in my head\nNo words we never said\n\n[Pre-Chorus]\nWould I be better off alone?\nOr just not know what I was missin'?\n'Cause now I know how deep love goes\nAnd I can't forget the feelin'\n\n[Chorus]\nIf we never happened\nWould I still be whole?\nOr just incomplete\nAnd never even know?\n\nIf we never happened\nWould it hurt this way?\nOr would I be safe\nFrom the mess we made?\n\n[Bridge]\nI'd erase you if I could\nBut I wouldn't if I'm honest\n'Cause even all this hurt\nStill feels better than nothin'\n\n[Outro]\nIf we never happened…\nWould I even know love?\nYeah…`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Unrealistic Expectations", artist: "MUZE", album: "Late Night Sessions", genre: "R&B",
    duration: 213, price: 1.99, releaseYear: 2026, featured: true, bpm: 85, keySignature: "D major",
    description: "Modern R&B storytelling with attitude — what do you bring to the table?",
    lyrics: `[Intro]\nYeah… You got a whole list, don't you\nBut tell me… what you givin'?\n\n[Verse 1]\nYou say you want a man six-two, CEO\nNever home but still got time to hold you close\nGotta make six figures, never say no\nRead your mind like he wrote your soul\n\n[Chorus]\nYou got unrealistic expectations\nWant a king but you ain't bringin' no foundation\nWant perfection, no hesitation\nBut what you bringin' to the situation?\n\nYou want loyalty, dedication\nNeed a man with elevation\nBut love don't work with just demands\nSo tell me, baby, what's in your hands?\n\n[Bridge]\nI don't need perfection, just consistency\nSomeone who gon' ride and build with me\n'Cause love goes both ways, not just your way\n\n[Outro]\nYeah… You want the world in a man\nBut what you givin' back? Think about that…`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Midnight Silk", artist: "MUZE", album: "Late Night Sessions", genre: "R&B",
    duration: 229, price: 1.99, releaseYear: 2026, featured: false, bpm: 75, keySignature: "F minor",
    description: "Smooth late-night R&B with rhodes, soft pads, and deep sub bass.",
    lyrics: `[Intro]\nLate night… just you and me…\n\n[Verse 1]\nThe city's quiet now, just the glow of screens\nI've been thinking 'bout you and what this all means\nSoft rhodes playing while the rain falls down\nYou're the only peace I've ever found\n\n[Chorus]\nMidnight silk, the way you move\nEvery touch a melody, every word a groove\nCan't sleep without you on my mind\nYou're the kind of love that's hard to find\n\n[Bridge]\nStay a little longer, don't rush the night\nIn your arms is where everything feels right\n\n[Outro]\nMidnight… just stay…`,
    coverUrl: null, audioUrl: null,
  },

  // Trap
  {
    title: "Atlanta Classic", artist: "MUZE", album: "Trap Wave Vol.1", genre: "Trap",
    duration: 198, price: 1.99, releaseYear: 2026, featured: false, bpm: 140, keySignature: "C minor",
    description: "Hard Atlanta trap — heavy 808s, crisp hi-hats, street energy.",
    lyrics: `[Intro]\nYeah, ATL… Real trap shit…\n\n[Verse 1]\nStarted from the bottom, now I'm runnin' through these streets\nEvery dollar I've earned came from hustle and defeat\n808s knockin', they can feel me from a mile\nStayed true to the game, never changed my style\n\n[Hook]\nAtlanta classic, trap in my veins\nCame up from nothing, still countin' the gains\nHeavy on the 808, crisp on the hats\nIf you know where I'm from, then you know where it's at\n\n[Verse 2]\nThey said I wouldn't make it, said the odds were stacked\nKept my head down, never looked back\nEvery late night was an investment\nEvery struggle was a lesson\n\n[Outro]\nATL, yeah… That's where legends are made…`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Melodic Trap Wave", artist: "MUZE", album: "Trap Wave Vol.1", genre: "Trap",
    duration: 185, price: 1.99, releaseYear: 2026, featured: false, bpm: 130, keySignature: "A minor",
    description: "Melodic trap with piano, rolling hi-hats and auto-tuned emotion.",
    lyrics: `[Intro]\nAyy…\n\n[Verse 1]\nPiano keys over 808 drums\nSinging through the pain till the morning comes\nAuto-tune can't hide what I really feel\nEvery word I drop on this track is real\n\n[Chorus]\nMelodic trap wave, riding through the night\nEmotions on the beat, pain and love collide\nCan't stop the feeling, it's too deep inside\nMelodic trap wave, yeah, this is my life\n\n[Bridge]\nThey say I'm too emotional for the streets\nBut the streets need emotion, that's the point they miss\nReal music hits you where you live and breathe\n\n[Outro]\nYeah… Ride the wave…`,
    coverUrl: null, audioUrl: null,
  },

  // Christian/Worship
  {
    title: "Falling in Love with Jesus", artist: "MUZE", album: "Worship Collection", genre: "Christian/Worship",
    duration: 251, price: 0.99, releaseYear: 2026, featured: true, bpm: 72, keySignature: "G major",
    description: "A worship ballad in G Major — tender, joyful, and surrendered.",
    lyrics: `[Intro]\nLord, I never thought I'd feel this way…\nBut here I am…\n\n[Verse 1]\nI used to run from everything You offered me\nChasing hollow things that left me empty\nBut You waited with Your arms wide open still\nWhen I finally stopped running, Lord, I felt Your will\n\n[Pre-Chorus]\nSomething changed inside my heart\nLike a light that cuts through dark\nI can't explain this peace I've found\nSince You turned my whole life around\n\n[Chorus]\nI'm falling in love with Jesus\nEvery single day\nHe takes my broken pieces\nAnd heals them with His grace\n\nFalling deeper, can't stop it\nHis love is all I need\nI'm falling in love with Jesus\nAnd finally I'm free\n\n[Bridge]\nYou are my refuge, You are my song\nIn Your presence is where I belong\nEvery morning new mercy I find\nYou restore my weary mind\n\n[Outro]\nFalling in love… With You, Jesus…`,
    coverUrl: null, audioUrl: null,
  },

  // Gospel
  {
    title: "Hallelujah Anyway", artist: "MUZE", album: "Worship Collection", genre: "Gospel",
    duration: 264, price: 0.99, releaseYear: 2026, featured: true, bpm: 96, keySignature: "Bb major",
    description: "A powerful gospel anthem — choir harmonies, Hammond organ, thunderous drums.",
    lyrics: `[Intro]\nSomebody praise Him in here tonight!\n\n[Verse 1]\nI went through the valley, thought I wouldn't make it\nEvery step felt heavy, my faith was nearly breakin'\nBut in the darkest moment when I had nothing left\nHe showed up right on time, took away my stress\n\n[Pre-Chorus]\nI don't understand it all\nBut I know who holds my call\nThrough the storm I learned to say\n\n[Chorus]\nHallelujah anyway!\nHallelujah through the pain!\nWhen I couldn't see my way\nHe made a way — Hallelujah anyway!\n\n[Verse 2]\nJoy comes in the morning even after the night\nWeeping may endure but He restores my sight\nEvery test becomes a testimony, I know\nWhat the enemy meant for evil, God said "watch it grow"\n\n[Bridge]\nI will praise Him through the fire\nI will lift Him higher, higher\nNothing in this world can stop my song\nHallelujah all day long!\n\n[Outro]\nHallelujah… Hallelujah… Hallelujah anyway!`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Sunday Morning Glory", artist: "MUZE", album: "Worship Collection", genre: "Gospel",
    duration: 238, price: 0.99, releaseYear: 2026, featured: false, bpm: 88, keySignature: "E major",
    description: "Feel-good gospel with a live choir, brass section, and soulful energy.",
    lyrics: `[Intro]\nEvery Sunday morning…\n\n[Verse 1]\nWoke up this morning with a brand new song\nThought about how far He brought me all along\nDressed in my best 'cause I'm going to praise\nGonna worship His name through all of my days\n\n[Chorus]\nSunday morning glory\nHis mercies never end\nSunday morning glory\nPraising God again and again\n\n[Bridge]\nLet the choir sing, let the organ play\nLet every heart rejoice on this glorious day\n\n[Outro]\nGlory… glory… glory…`,
    coverUrl: null, audioUrl: null,
  },

  // Neo Soul
  {
    title: "Brown Sugar Rain", artist: "MUZE", album: "Neo Soul Diaries", genre: "Neo Soul",
    duration: 272, price: 1.99, releaseYear: 2026, featured: true, bpm: 82, keySignature: "E minor",
    description: "Organic neo soul with live bass, electric piano, and raw emotional vocals.",
    lyrics: `[Intro]\nMmm… feel this…\n\n[Verse 1]\nGrass still wet from last night's tears\nYou been holdin' back for too many years\nLive bass walkin' underneath your heart\nLet it out, girl, before it tears you apart\n\n[Pre-Chorus]\nYou don't have to be strong all the time\nLay it down, let the music be your sign\n\n[Chorus]\nBrown sugar rain, wash it all away\nEvery little pain that you carry every day\nLet the neo soul just take you somewhere real\nBrown sugar rain, let yourself feel\n\n[Verse 2]\nElectric piano playin' quarter notes slow\nYou swaying by the window in that soft golden glow\nThis ain't about perfection, just about truth\nEverybody hurts — let the music be your proof\n\n[Bridge]\nClose your eyes and breathe it in\nEvery note a healing place to begin\nYou were never meant to carry it alone\nLet the music lead you home\n\n[Outro]\nBrown sugar rain… let it fall…`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Afro Soul Sunrise", artist: "MUZE", album: "Neo Soul Diaries", genre: "Neo Soul",
    duration: 245, price: 1.99, releaseYear: 2026, featured: false, bpm: 78, keySignature: "D minor",
    description: "Soulful Afro-influenced neo soul with warm percussion and layered harmonies.",
    lyrics: `[Intro]\nRise up… feel the morning…\n\n[Verse 1]\nDjembe drum calling out the dawn\nKora strings painting colors of the sun\nYour heartbeat matches the rhythm of the earth\nEvery new morning reminding you your worth\n\n[Chorus]\nAfro soul sunrise, open up your eyes\nAll the beauty waiting beyond the compromise\nDance to the rhythm that your ancestors knew\nAfro soul sunrise — it's calling out to you\n\n[Bridge]\nFrom Lagos to Atlanta, the soul stays the same\nFrom Lagos to Atlanta, we're all in this flame\n\n[Outro]\nSunrise… feel it…`,
    coverUrl: null, audioUrl: null,
  },

  // Hip-Hop
  {
    title: "King's Monologue", artist: "MUZE", album: "Crown Chronicles", genre: "Hip-Hop",
    duration: 223, price: 1.99, releaseYear: 2026, featured: true, bpm: 92, keySignature: "G minor",
    description: "Lyric-heavy hip-hop with boom-bap drums and sharp wordplay.",
    lyrics: `[Intro]\nListen close…\n\n[Verse 1]\nI write chapters not verses, this is literature\nEvery bar a mirror where the world can look bigger\nThey gave me a mic and I turned it to a scepter\nSpoken word king, I am my own protector\n\nFrom the struggle came the syllables, from pain came the art\nEvery sleepless night deposited straight to my heart\nI don't rap for applause, I rap for the real ones\nThe ones who feel everything and still try to heal, son\n\n[Chorus]\nKing's monologue, every word a throne\nBuilt this kingdom brick by brick, stone by stone\nThey counted me out, I turned doubt to a crown\nKing's monologue — I am never going down\n\n[Verse 2]\nThe pen is my weapon and wisdom is my armor\nI study the masters — Nas, Hov, and Lamar\nBut the story I tell is uniquely my own\nEvery scar on my record is a seed that I've grown\n\n[Outro]\nThis is my monologue… This is my throne…`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "City Lights Flow", artist: "MUZE", album: "Crown Chronicles", genre: "Hip-Hop",
    duration: 198, price: 1.99, releaseYear: 2026, featured: false, bpm: 88, keySignature: "C minor",
    description: "Smooth hip-hop with jazz samples and introspective night-time energy.",
    lyrics: `[Intro]\nCity lights, late night…\n\n[Verse 1]\nCruising through the city when the world's asleep\nJazz sample cutting through the thoughts I keep\nStreetlights flickering like they know my name\nEvery block a verse in this ongoing game\n\n[Chorus]\nCity lights flow, where do we go?\nWhen the day is done and it's just us and the glow\nCity lights flow, I let the beat take me home\nEven in the crowd I'm never quite alone\n\n[Bridge]\nSaxophone wailing over kicks and snares\nThat old jazz spirit floating through the night air\nSome things don't change no matter the year\nReal music is the only thing that keeps me here\n\n[Outro]\nCity lights… flowing…`,
    coverUrl: null, audioUrl: null,
  },

  // Pop
  {
    title: "Glow Up Season", artist: "MUZE", album: "Shine Collective", genre: "Pop",
    duration: 195, price: 1.49, releaseYear: 2026, featured: true, bpm: 118, keySignature: "A major",
    description: "Uplifting pop anthem about self-growth, confidence, and elevation.",
    lyrics: `[Intro]\nOh-oh-oh… yeah!\n\n[Verse 1]\nWoke up different, something changed inside\nLook in the mirror and I finally like what I find\nAll those nights I cried, all those times I fell\nLook at where I am now — I came out of that shell\n\n[Pre-Chorus]\nThey said it wouldn't happen, said I had to settle\nBut I kept on pushing, proving I had mettle\n\n[Chorus]\nGlow up season, I am shining bright\nEvery single day I'm stepping into my light\nGlow up season, no more playing small\nI was always this amazing — I just had to recall\n\n[Verse 2]\nDrinks with friends who actually show up\nNew energy, new goals, new level glow up\nCelebrating every win, no matter how small\nStanding tall, baby, I am standing tall\n\n[Bridge]\nI don't need their validation\nI am my own motivation\nWatch me level up, watch me elevate\nIt's my glow up season — celebrate!\n\n[Outro]\nGlow up… shine… yeah!`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Radio Love", artist: "MUZE", album: "Shine Collective", genre: "Pop",
    duration: 187, price: 1.49, releaseYear: 2026, featured: false, bpm: 124, keySignature: "C major",
    description: "Catchy pop with infectious hooks and feel-good summer energy.",
    lyrics: `[Intro]\nTurn it up...\n\n[Verse 1]\nHeard our song come on the radio today\nSmiled so hard, forgot all my troubles away\nEvery chorus hit me like the very first time\nHow do you make everything feel so fine?\n\n[Chorus]\nRadio love, playing on repeat\nYou're the song that never skips a beat\nRadio love, every station you're there\nYou're the melody I find everywhere\n\n[Bridge]\nSome people search their whole lives for a feeling\nI found mine in three minutes and some seconds\nThat's what music does, that's what love does\nTurns an ordinary moment to something more\n\n[Outro]\nRadio love… forever on…`,
    coverUrl: null, audioUrl: null,
  },

  // Drill
  {
    title: "No Smoke", artist: "MUZE", album: "Street Certified", genre: "Drill",
    duration: 192, price: 1.99, releaseYear: 2026, featured: false, bpm: 145, keySignature: "D minor",
    description: "Dark UK/Chicago Drill hybrid — sliding 808s, menacing piano loops.",
    lyrics: `[Intro]\nNo smoke… they know…\n\n[Verse 1]\nI move in silence like the night moves through a city\nThey say they want smoke but when they see me it gets iffy\nDark piano loop playing under my ambition\nEvery verse I spit is a calculated decision\n\nSliding 808s underneath the street lights glow\nBuilt this from nothing, they don't even know\nDrill in my DNA, it's just how I'm wired\nI don't aim to threaten — I aim to inspire\n\n[Chorus]\nNo smoke, they clear the room when I walk in\nNo smoke, the energy shifts before I even begin\nNo smoke, but they know what I'm about\nNo smoke — my presence alone speaks without a doubt\n\n[Bridge]\nFrom the bottom to the top is a straight vertical\nEvery obstacle I faced made me more versatile\n\n[Outro]\nNo smoke… they know what it is…`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Block Report", artist: "MUZE", album: "Street Certified", genre: "Drill",
    duration: 178, price: 1.99, releaseYear: 2026, featured: false, bpm: 142, keySignature: "F minor",
    description: "Raw drill storytelling over dark production — authentic street narrative.",
    lyrics: `[Intro]\nThis is the block report…\n\n[Verse 1]\nEvery corner got a story if you listen right\nEvery face on this block been through a different fight\nI'm just the one who picked up a pen instead\nTurned the pain of the pavement into music instead\n\n[Chorus]\nBlock report, telling it how it is\nBlock report, every verse is real\nThese ain't fairy tales, this is what we live\nBlock report — this is my story to give\n\n[Verse 2]\nThey glorify the struggle but forget the cost\nEvery trophy in the game came with something lost\nBut we keep going 'cause what else do we do?\nBlock report — this one is for you\n\n[Outro]\nBlock report… the real story…`,
    coverUrl: null, audioUrl: null,
  },

  // Soul
  {
    title: "Old Soul New Story", artist: "MUZE", album: "Soul Archive", genre: "Soul",
    duration: 258, price: 1.99, releaseYear: 2026, featured: true, bpm: 68, keySignature: "Eb major",
    description: "Classic soul influence with a modern twist — Hammond B3, Fender Rhodes.",
    lyrics: `[Intro]\nMmm… they don't make it like this anymore…\n\n[Verse 1]\nHammond B3 running through my soul tonight\nFender rhodes beneath a single candlelight\nGrandma used to hum this melody\nNow I'm passing down the harmony\n\n[Pre-Chorus]\nOld soul music never really dies\nIt just changes form, wears a new disguise\n\n[Chorus]\nOld soul new story, same love to tell\nFrom the cotton fields to the concert hall, we rose and fell\nOld soul new story, still got something to say\nThe music carries everything that words can't convey\n\n[Verse 2]\nSam Cooke and Aretha in the walls of my mind\nI'm not imitating, I'm just continuing the line\nEvery generation adds their truth to the song\nThat's how soul music has been going on so long\n\n[Bridge]\nChange gon' come, it already has\nListen to the music and you'll understand\nEvery voice that rises carries those who came before\nOld soul new story — there's always more\n\n[Outro]\nOld soul… new story…`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Tender Mercy", artist: "MUZE", album: "Soul Archive", genre: "Soul",
    duration: 232, price: 1.99, releaseYear: 2026, featured: false, bpm: 72, keySignature: "A major",
    description: "Warm, intimate soul ballad about grace, forgiveness, and love.",
    lyrics: `[Intro]\nSometimes love surprises you…\n\n[Verse 1]\nI didn't deserve the kindness that you showed\nAfter all the damage that I caused down that road\nBut you looked at me like I was worth saving still\nThat kind of grace I never thought I'd feel\n\n[Chorus]\nTender mercy, that's what you gave to me\nWhen I was broken and I couldn't even see\nTender mercy, soft and honest and true\nI never knew love until I knew you\n\n[Bridge]\nFor every wrong I ever did\nYou responded with a gentle hand\nI'm still learning what it means to receive\nBut I'm grateful that you help me believe\n\n[Outro]\nTender mercy… thank you…`,
    coverUrl: null, audioUrl: null,
  },

  // Afrobeats
  {
    title: "Lagos Nights", artist: "MUZE", album: "Diaspora Frequencies", genre: "Afrobeats",
    duration: 218, price: 1.99, releaseYear: 2026, featured: true, bpm: 104, keySignature: "G major",
    description: "Energetic Afrobeats with Yoruba rhythms, shekere percussion, and infectious groove.",
    lyrics: `[Intro]\nLagos… e dey sweet!\n\n[Verse 1]\nFrom the island to the mainland, we celebrate\nEvery night in Lagos is a different fate\nAfrobeats pumping from every open door\nOnce you start dancing you can't stop no more\n\nMama said dance like nobody's watching tonight\nPapa said move and let the rhythm feel right\nFive generations of rhythm in my feet\nEvery Lagos night, the whole city on beat\n\n[Chorus]\nLagos nights, the energy is real\nLagos nights, you can't explain the feel\nAfrican rhythm in my soul, in my bones\nLagos nights — everywhere I go, Lagos is home\n\n[Verse 2]\nSuya on the grill, Star lager in hand\nAfrobeats DJ, best in all the land\nFrom Mainland to Victoria Island we vibe\nThis is the Lagos nights, the African pride\n\n[Bridge]\nWe go dance all night\nWe go shine so bright\nAfrica in every note\nIn every beat we wrote\n\n[Outro]\nLagos nights… e dey sweet… all night!`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Jollof & Vibes", artist: "MUZE", album: "Diaspora Frequencies", genre: "Afrobeats",
    duration: 204, price: 1.99, releaseYear: 2026, featured: false, bpm: 108, keySignature: "C major",
    description: "Fun, celebratory Afrobeats banger built for the dancefloor.",
    lyrics: `[Intro]\nHey! Let's go!\n\n[Verse 1]\nJollof on the table and the music loud\nFriends and family filling up the crowd\nThis is what we do when the weekend's here\nAfrobeats and laughter, nothing but good cheer\n\n[Chorus]\nJollof and vibes, that's all we need\nGood food, good music, everybody freed\nJollof and vibes, African dream\nLife is better than it might seem\n\n[Bridge]\nGhana or Nigeria, the debate goes on\nBut when the beat drops, we all move along\nFunny how music settles every fight\nJollof and vibes on a Saturday night\n\n[Outro]\nJollof and vibes… all night!`,
    coverUrl: null, audioUrl: null,
  },

  // Jazz
  {
    title: "Blue Note Confessions", artist: "MUZE", album: "After Hours Jazz", genre: "Jazz",
    duration: 312, price: 2.49, releaseYear: 2026, featured: false, bpm: 58, keySignature: "Bb minor",
    description: "Smoky late-night jazz with muted trumpet, walking bass, and brushed snare.",
    lyrics: `[Intro]\nLate night… cigarette smoke and blue lights…\n\n[Verse 1]\nMuted trumpet crying in a minor key\nTells the story that my words can't seem to free\nWalking bass line, it's confessing something deep\nAll the feelings that I promised I would keep\n\n[Bridge]\nBrush on snare like whispers in the dark\nEvery note is just another broken heart\nBut the beauty in the breaking is the art\nJazz was always honest from the start\n\n[Chorus]\nBlue note confessions, truth through sound\nAll the things I've lost and all the love I've found\nBlue note confessions, hear what I can't say\nThe music speaks when words just get in the way\n\n[Outro]\nBlue note confessions… fading out…`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Rainy Day Quartet", artist: "MUZE", album: "After Hours Jazz", genre: "Jazz",
    duration: 287, price: 2.49, releaseYear: 2026, featured: false, bpm: 62, keySignature: "F major",
    description: "Warm acoustic jazz quartet — perfect for introspective rainy days.",
    lyrics: `[Intro]\nRain on the window… four instruments, one feeling…\n\n[Verse 1]\nPiano chords falling soft like raindrops\nUpright bass underneath where the tempo stops\nSaxophone breathing out a melody so real\nThis is the kind of music that makes you feel\n\n[Chorus]\nRainy day quartet, we play it slow\nLetting every note have somewhere to go\nRainy day quartet, no rush today\nSometimes the music needs time to say\n\n[Outro]\nQuartet playing on… rain falling…`,
    coverUrl: null, audioUrl: null,
  },

  // Reggae
  {
    title: "Roots & Elevation", artist: "MUZE", album: "Island Chronicles", genre: "Reggae",
    duration: 236, price: 1.49, releaseYear: 2026, featured: false, bpm: 76, keySignature: "D major",
    description: "Conscious reggae with Rastafarian roots — one drop rhythm, heavy bass, positive vibes.",
    lyrics: `[Intro]\nOne love… one heart…\n\n[Verse 1]\nRoots run deep like the river to the sea\nEvery generation plant the seed of the free\nRiddem playing steady like the heartbeat of the earth\nReggae music been reminding us our worth\n\n[Pre-Chorus]\nElevate your mind, elevate your soul\nEvery mountain that you climb makes you whole\n\n[Chorus]\nRoots and elevation, that's the way we live\nEverything we take from the earth, we must give\nRoots and elevation, conscious every day\nRasta vibes and good music light the way\n\n[Verse 2]\nFrom Kingston to the world the message ring clear\nLove is the only weapon we need here\nBob showed us the power of a simple song\nThree chords and the truth, you can't go wrong\n\n[Bridge]\nJah provide, Jah guide\nEvery step of every stride\nRoots and culture, truth and rights\nRegge music burning bright\n\n[Outro]\nRoots… elevation… one love…`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Island Morning", artist: "MUZE", album: "Island Chronicles", genre: "Reggae",
    duration: 212, price: 1.49, releaseYear: 2026, featured: false, bpm: 80, keySignature: "G major",
    description: "Feel-good dancehall-influenced reggae with a sunny island vibe.",
    lyrics: `[Intro]\nGood morning island… rise up!\n\n[Verse 1]\nSunrise over the island, birds begin to sing\nSalt breeze and coffee, what a morning it brings\nFootsteps on the sand, rhythm in the tide\nIsland morning feeling, can't hide the smile inside\n\n[Chorus]\nIsland morning, everything is nice\nIsland morning, living paradise\nSun is shining, music playing sweet\nIsland morning, feel it in your feet\n\n[Bridge]\nNothing like a morning on the island\nPeace of mind feels natural and vital\nWake up to the rhythm of the ocean\nThis is the original devotion\n\n[Outro]\nIsland morning… beautiful day…`,
    coverUrl: null, audioUrl: null,
  },

  // Lofi / Study
  {
    title: "2AM Study Session", artist: "MUZE", album: "Lo-Fi Frequencies", genre: "Lo-Fi",
    duration: 198, price: 0.99, releaseYear: 2026, featured: false, bpm: 70, keySignature: "C minor",
    description: "Chill lo-fi hip-hop with vinyl crackle, jazzy chords, and mellow atmosphere.",
    lyrics: `[Intro]\nLate night… coffee getting cold…\n\n[Verse 1]\nScreen glow in a dark room, 2AM\nThe deadline's close but the music's my friend\nVinyl crackle under jazzy piano chords\nLo-fi telling me there's no need to rush towards\n\n[Chorus]\n2AM study session, just me and the beat\nChaos in my notebook but the music's complete\nMellow frequencies washing over the stress\nLo-fi always helping me do my best\n\n[Bridge]\nSomewhere someone else is up this late\nLofi connecting us across every fate\nWe don't need to know each other's name\nThe music makes us feel exactly the same\n\n[Outro]\nCoffee's cold… still going… lo-fi all night…`,
    coverUrl: null, audioUrl: null,
  },
  {
    title: "Cozy Corner Vibes", artist: "MUZE", album: "Lo-Fi Frequencies", genre: "Lo-Fi",
    duration: 215, price: 0.99, releaseYear: 2026, featured: false, bpm: 65, keySignature: "F major",
    description: "Warm lo-fi beat with rain sounds, soft keys, and a feel-good mellow groove.",
    lyrics: `[Intro]\nRain outside… warm inside…\n\n[Verse 1]\nRain tapping at the window like a gentle friend\nThis cozy corner feeling, hope it never ends\nSoft keys and mellow bass line, nothing complicated\nJust good vibes and peace, that's what I've always waited\n\n[Chorus]\nCozy corner vibes, that's where I want to be\nNo drama, no pressure, just music flowing free\nCozy corner vibes, lo-fi on the speakers\nLife is better when the music makes you a believer\n\n[Outro]\nRain keeps falling… cozy corner stays warm…`,
    coverUrl: null, audioUrl: null,
  },
];

function seedIfEmpty() {
  const existing = db.select().from(songs).all();
  if (existing.length === 0) {
    for (const s of SEED_SONGS) {
      db.insert(songs).values(s).run();
    }
  } else {
    // Add any missing songs (new genres)
    const existingTitles = new Set(existing.map(s => s.title));
    for (const s of SEED_SONGS) {
      if (!existingTitles.has(s.title)) {
        db.insert(songs).values(s).run();
      }
      // Patch lyrics if missing
      const match = existing.find(e => e.title === s.title);
      if (match && !match.lyrics && s.lyrics) {
        db.update(songs).set({ lyrics: s.lyrics, bpm: s.bpm ?? null, keySignature: s.keySignature ?? null }).where(eq(songs.id, match.id)).run();
      }
    }
  }

  // Seed playlists if none exist
  const existingPlaylists = db.select().from(playlists).all();
  if (existingPlaylists.length === 0) {
    const allSongs = db.select().from(songs).all();
    const byGenre = (genre: string) => allSongs.filter(s => s.genre === genre).map(s => s.id);

    const playlistDefs = [
      { name: "Late Night R&B", description: "Smooth R&B for emotional late-night moments", genres: ["R&B"] },
      { name: "Trap Wave", description: "Hard-hitting trap bangers and melodic vibes", genres: ["Trap", "Drill"] },
      { name: "Worship Collection", description: "Christian, Gospel & Worship music for the soul", genres: ["Christian/Worship", "Gospel"] },
      { name: "Soul & Neo Soul", description: "Classic soul and organic neo soul vibes", genres: ["Soul", "Neo Soul"] },
      { name: "Hip-Hop & Flow", description: "Lyrical hip-hop with depth and style", genres: ["Hip-Hop"] },
      { name: "Global Vibes", description: "Afrobeats, Reggae and world music energy", genres: ["Afrobeats", "Reggae"] },
      { name: "Lo-Fi & Jazz", description: "Chill lo-fi and late-night jazz sessions", genres: ["Lo-Fi", "Jazz"] },
      { name: "Pop Hits", description: "Catchy pop anthems for every mood", genres: ["Pop"] },
    ];

    for (const def of playlistDefs) {
      const ids = def.genres.flatMap(g => byGenre(g));
      if (ids.length > 0) {
        db.insert(playlists).values({ name: def.name, description: def.description, coverUrl: null, songIds: JSON.stringify(ids), isSystem: false }).run();
      }
    }
  }
}

seedIfEmpty();

export const storage: IStorage = {
  getAllSongs() { return db.select().from(songs).all(); },
  getSongById(id) { return db.select().from(songs).where(eq(songs.id, id)).get(); },
  getFeaturedSongs() { return db.select().from(songs).all().filter(s => s.featured); },
  searchSongs(query) {
    const q = query.toLowerCase();
    return db.select().from(songs).all().filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      (s.album || "").toLowerCase().includes(q) ||
      s.genre.toLowerCase().includes(q)
    );
  },
  createSong(song) { return db.insert(songs).values(song).returning().get(); },
  updateSong(id, data) { return db.update(songs).set(data).where(eq(songs.id, id)).returning().get(); },
  incrementPlayCount(id) {
    const song = db.select().from(songs).where(eq(songs.id, id)).get();
    if (song) db.update(songs).set({ playCount: (song.playCount || 0) + 1 }).where(eq(songs.id, id)).run();
  },
  getAllPlaylists() { return db.select().from(playlists).all(); },
  getPlaylistById(id) {
    const pl = db.select().from(playlists).where(eq(playlists.id, id)).get();
    return pl;
  },
  createPlaylist(data) { return db.insert(playlists).values(data).returning().get(); },
  updatePlaylist(id, data) { return db.update(playlists).set(data).where(eq(playlists.id, id)).returning().get(); },
  deletePlaylist(id) { db.delete(playlists).where(eq(playlists.id, id)).run(); },
  getLikedSongs() { return db.select().from(likedSongs).orderBy(desc(likedSongs.likedAt)).all(); },
  likeSong(songId) { return db.insert(likedSongs).values({ songId, likedAt: new Date() }).returning().get(); },
  unlikeSong(songId) { db.delete(likedSongs).where(eq(likedSongs.songId, songId)).run(); },
  isSongLiked(songId) { return !!db.select().from(likedSongs).where(eq(likedSongs.songId, songId)).get(); },
  getHistory(limit = 20) { return db.select().from(listeningHistory).orderBy(desc(listeningHistory.playedAt)).limit(limit).all(); },
  addHistory(songId) { db.insert(listeningHistory).values({ songId, playedAt: new Date() }).run(); },
  createOrder(order) { return db.insert(orders).values({ ...order, createdAt: new Date() }).returning().get(); },
  getAllOrders() { return db.select().from(orders).all(); },

  // ─── Payment Storage ───────────────────────────────────────────────────────
  createPayment(data) {
    const MUZE_SPLIT_RATE = 0.40;
    const ARTIST_SPLIT_RATE = 0.60;
    const muzeSplit = Math.round(data.grossAmount * MUZE_SPLIT_RATE * 100) / 100;
    const artistSplit = Math.round(data.grossAmount * ARTIST_SPLIT_RATE * 100) / 100;
    // Generate a cryptographically random token
    const crypto = require("crypto");
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    // Cash App handle or Zelle email
    const handle = data.paymentMethod === "cashapp" ? "$MUZEmusic" : "payments@muze.music";
    return db.insert(payments).values({
      itemType: data.itemType,
      itemId: data.itemId ?? null,
      itemTitle: data.itemTitle,
      buyerName: data.buyerName,
      buyerEmail: data.buyerEmail,
      recipientName: data.recipientName ?? null,
      recipientEmail: data.recipientEmail ?? null,
      giftMessage: data.giftMessage ?? null,
      isGift: data.isGift ?? false,
      grossAmount: data.grossAmount,
      muzeSplit,
      artistSplit,
      paymentMethod: data.paymentMethod,
      paymentHandle: handle,
      status: "pending",
      confirmationToken,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      createdAt: new Date(),
      confirmedAt: null,
    }).returning().get();
  },

  getPaymentByToken(token) {
    return db.select().from(payments).where(eq(payments.confirmationToken, token)).get();
  },

  confirmPayment(token) {
    const payment = db.select().from(payments).where(eq(payments.confirmationToken, token)).get();
    if (!payment) return undefined;
    if (payment.status !== "pending") return payment;
    return db.update(payments)
      .set({ status: "confirmed", confirmedAt: new Date() })
      .where(eq(payments.confirmationToken, token))
      .returning().get();
  },

  failPayment(token) {
    db.update(payments).set({ status: "failed" })
      .where(eq(payments.confirmationToken, token)).run();
  },

  getAllPayments() {
    return db.select().from(payments).orderBy(desc(payments.createdAt)).all();
  },

  getPaymentStats() {
    const all = db.select().from(payments).all();
    const confirmed = all.filter(p => p.status === "confirmed");
    return {
      totalRevenue: confirmed.reduce((s, p) => s + p.grossAmount, 0),
      muzeTake: confirmed.reduce((s, p) => s + p.muzeSplit, 0),
      artistTake: confirmed.reduce((s, p) => s + p.artistSplit, 0),
      totalCount: all.length,
      pendingCount: all.filter(p => p.status === "pending").length,
    };
  },

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  checkRateLimit(key, maxHits, windowMs) {
    const now = Date.now();
    const existing = db.select().from(rateLimits).where(eq(rateLimits.key, key)).get();
    if (!existing) {
      db.insert(rateLimits).values({ key, hits: 1, windowStart: now }).run();
      return true; // allowed
    }
    if (now - existing.windowStart > windowMs) {
      // Window expired — reset
      db.update(rateLimits).set({ hits: 1, windowStart: now }).where(eq(rateLimits.key, key)).run();
      return true;
    }
    if (existing.hits >= maxHits) return false; // blocked
    db.update(rateLimits).set({ hits: existing.hits + 1 }).where(eq(rateLimits.key, key)).run();
    return true;
  },

  // ─── Artist Auth Storage ───────────────────────────────────────────────────────
  createArtist(data) {
    return db.insert(artists).values({
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      phone: data.phone,
      isVerified: false,
      verificationToken: data.verificationToken,
      verificationExpiry: data.verificationExpiry,
      sq1: data.sq1, sa1: data.sa1,
      sq2: data.sq2, sa2: data.sa2,
      sq3: data.sq3, sa3: data.sa3,
      resetToken: null, resetExpiry: null, resetVerified: false,
      createdAt: new Date(),
      lastLogin: null,
      loginAttempts: 0,
      lockedUntil: null,
    }).returning().get();
  },

  getArtistByEmail(email) {
    return db.select().from(artists).where(eq(artists.email, email.toLowerCase().trim())).get();
  },

  getArtistById(id) {
    return db.select().from(artists).where(eq(artists.id, id)).get();
  },

  getArtistByVerificationToken(token) {
    return db.select().from(artists).where(eq(artists.verificationToken, token)).get();
  },

  verifyArtistEmail(id) {
    db.update(artists)
      .set({ isVerified: true, verificationToken: null, verificationExpiry: null })
      .where(eq(artists.id, id)).run();
  },

  updateLoginAttempts(id, attempts, lockedUntil) {
    db.update(artists)
      .set({ loginAttempts: attempts, lockedUntil: lockedUntil ?? null })
      .where(eq(artists.id, id)).run();
  },

  updateLastLogin(id) {
    db.update(artists)
      .set({ lastLogin: new Date(), loginAttempts: 0, lockedUntil: null })
      .where(eq(artists.id, id)).run();
  },

  setResetToken(id, token, expiry) {
    db.update(artists)
      .set({ resetToken: token, resetExpiry: expiry, resetVerified: false })
      .where(eq(artists.id, id)).run();
  },

  markResetVerified(id) {
    db.update(artists).set({ resetVerified: true }).where(eq(artists.id, id)).run();
  },

  updatePassword(id, passwordHash) {
    db.update(artists)
      .set({ passwordHash, resetToken: null, resetExpiry: null, resetVerified: false, loginAttempts: 0, lockedUntil: null })
      .where(eq(artists.id, id)).run();
  },

  getArtistByResetToken(token) {
    return db.select().from(artists).where(eq(artists.resetToken, token)).get();
  },

  clearResetToken(id) {
    db.update(artists)
      .set({ resetToken: null, resetExpiry: null, resetVerified: false })
      .where(eq(artists.id, id)).run();
  },

  // ─── Admin Methods ─────────────────────────────────────────────────────────
  deleteSong(id) {
    db.delete(songs).where(eq(songs.id, id)).run();
  },

  updatePaymentStatus(id, status) {
    return db.update(payments)
      .set({ status, confirmedAt: status === "confirmed" ? new Date() : undefined })
      .where(eq(payments.id, id))
      .returning().get();
  },

  getAllArtists() {
    return db.select().from(artists).all();
  },

  deleteArtist(id) {
    db.delete(artists).where(eq(artists.id, id)).run();
  },
};
