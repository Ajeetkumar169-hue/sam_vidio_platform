import { v4 as uuid } from "uuid"

// ── Types ──────────────────────────────────────────────────
export interface DBUser {
  id: string
  username: string
  email: string
  password: string // bcrypt hash
  role: "user" | "admin"
  avatar: string
  createdAt: string
}

export interface DBChannel {
  id: string
  ownerId: string
  name: string
  slug: string
  description: string
  logo: string
  banner: string
  subscriberCount: number
  videoCount: number
  createdAt: string
}

export interface DBVideo {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  channelId: string
  uploaderId: string
  categoryId: string
  tags: string[]
  visibility: "public" | "private" | "unlisted"
  views: number
  likes: number
  watchTime: number
  trendingScore: number
  isFeatured: boolean
  duration: string
  createdAt: string
}

export interface DBCategory {
  id: string
  name: string
  slug: string
  description: string
  videoCount: number
}

export interface DBComment {
  id: string
  videoId: string
  userId: string
  text: string
  parentComment: string | null
  likes: number
  createdAt: string
}

export interface DBLike {
  id: string
  userId: string
  videoId: string
}

export interface DBSubscription {
  id: string
  subscriberId: string
  channelId: string
}

// ── In-Memory Store (global to survive HMR) ───────────────
interface Store {
  users: DBUser[]
  channels: DBChannel[]
  videos: DBVideo[]
  categories: DBCategory[]
  comments: DBComment[]
  likes: DBLike[]
  subscriptions: DBSubscription[]
  seeded: boolean
}

declare global {
  // eslint-disable-next-line no-var
  var __store: Store | undefined
}

function createStore(): Store {
  return {
    users: [],
    channels: [],
    videos: [],
    categories: [],
    comments: [],
    likes: [],
    subscriptions: [],
    seeded: false,
  }
}

export function getStore(): Store {
  if (!global.__store) {
    global.__store = createStore()
  }
  return global.__store
}

// ── Seed default categories + demo data ────────────────────
const DEFAULT_CATEGORIES: Omit<DBCategory, "id">[] = [
  { name: "Viral Videos", slug: "viral-videos", description: "Trending and viral content that everyone is watching", videoCount: 0 },
  { name: "Entertainment", slug: "entertainment", description: "Fun and entertainment videos", videoCount: 0 },
  { name: "Music", slug: "music", description: "Music videos and performances", videoCount: 0 },
  { name: "Gaming", slug: "gaming", description: "Gaming content and walkthroughs", videoCount: 0 },
  { name: "Education", slug: "education", description: "Educational and tutorial content", videoCount: 0 },
  { name: "Sports", slug: "sports", description: "Sports highlights and events", videoCount: 0 },
  { name: "News", slug: "news", description: "Latest news and updates", videoCount: 0 },
  { name: "Comedy", slug: "comedy", description: "Comedy and humor content", videoCount: 0 },
  { name: "Lifestyle", slug: "lifestyle", description: "Lifestyle and vlog content", videoCount: 0 },
  { name: "Technology", slug: "technology", description: "Tech reviews and tutorials", videoCount: 0 },
  { name: "Art", slug: "art", description: "Art and creative content", videoCount: 0 },
]

const DEMO_CHANNELS: Omit<DBChannel, "id">[] = [
  { ownerId: "", name: "ViralNation", slug: "viralnation", description: "The best viral content on the internet", logo: "", banner: "", subscriberCount: 45200, videoCount: 0, createdAt: new Date().toISOString() },
  { ownerId: "", name: "TechVision", slug: "techvision", description: "Latest tech reviews and tutorials", logo: "", banner: "", subscriberCount: 12400, videoCount: 0, createdAt: new Date().toISOString() },
  { ownerId: "", name: "GameZone", slug: "gamezone", description: "Top gaming content", logo: "", banner: "", subscriberCount: 8900, videoCount: 0, createdAt: new Date().toISOString() },
  { ownerId: "", name: "MusicVibes", slug: "musicvibes", description: "Fresh beats and performances", logo: "", banner: "", subscriberCount: 23100, videoCount: 0, createdAt: new Date().toISOString() },
  { ownerId: "", name: "LearnDaily", slug: "learndaily", description: "Free education for everyone", logo: "", banner: "", subscriberCount: 15800, videoCount: 0, createdAt: new Date().toISOString() },
  { ownerId: "", name: "ComedyKings", slug: "comedykings", description: "Laugh until you cry", logo: "", banner: "", subscriberCount: 31500, videoCount: 0, createdAt: new Date().toISOString() },
]

function randomDuration(): string {
  const m = Math.floor(Math.random() * 20) + 1
  const s = Math.floor(Math.random() * 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function daysAgo(d: number) {
  return new Date(Date.now() - d * 86400000).toISOString()
}

const THUMBS = [
  "https://picsum.photos/seed/v1/640/360",
  "https://picsum.photos/seed/v2/640/360",
  "https://picsum.photos/seed/v3/640/360",
  "https://picsum.photos/seed/v4/640/360",
  "https://picsum.photos/seed/v5/640/360",
  "https://picsum.photos/seed/v6/640/360",
  "https://picsum.photos/seed/v7/640/360",
  "https://picsum.photos/seed/v8/640/360",
  "https://picsum.photos/seed/v9/640/360",
  "https://picsum.photos/seed/v10/640/360",
  "https://picsum.photos/seed/v11/640/360",
  "https://picsum.photos/seed/v12/640/360",
  "https://picsum.photos/seed/v13/640/360",
  "https://picsum.photos/seed/v14/640/360",
  "https://picsum.photos/seed/v15/640/360",
  "https://picsum.photos/seed/v16/640/360",
  "https://picsum.photos/seed/v17/640/360",
  "https://picsum.photos/seed/v18/640/360",
  "https://picsum.photos/seed/v19/640/360",
  "https://picsum.photos/seed/v20/640/360",
  "https://picsum.photos/seed/v21/640/360",
  "https://picsum.photos/seed/v22/640/360",
  "https://picsum.photos/seed/v23/640/360",
  "https://picsum.photos/seed/v24/640/360",
]

const VIDEO_TITLES = [
  "This Video Broke the Internet - 50M Views in 24hrs",
  "Building a Modern Web App with Next.js 16",
  "Top 10 Gaming Moments of the Year",
  "Acoustic Guitar Cover - Chill Vibes",
  "Machine Learning Explained in 10 Minutes",
  "You Won't Believe What Happened Next...",
  "Breaking News: Tech Industry Update",
  "Stand-Up Comedy Special - Laugh Out Loud",
  "Day in the Life of a Digital Nomad",
  "iPhone vs Android in 2026",
  "The Most Satisfying Video on the Internet",
  "Epic Football Highlights Compilation",
  "Study Music - Focus and Concentration",
  "How to Start a YouTube Channel",
  "React Server Components Deep Dive",
  "Cat Does the Most Unexpected Thing Ever",
  "The Future of AI in Everyday Life",
  "Cooking Italian Pasta Like a Chef",
  "Insane Street Performance Goes Viral",
  "10 Life Hacks That Actually Work",
  "Pixel Art Tutorial for Beginners",
  "Ultimate Home Workout Routine",
  "This Dog Can Actually Talk - Not Clickbait!",
  "World Record Attempt Caught on Camera",
]

export function seedStore() {
  const s = getStore()
  if (s.seeded) return

  // Seed categories
  s.categories = DEFAULT_CATEGORIES.map((c) => ({ ...c, id: uuid() }))

  // Seed channels
  s.channels = DEMO_CHANNELS.map((ch) => ({ ...ch, id: uuid() }))

  // Seed demo videos
  const catMap: Record<string, string> = {}
  for (const c of s.categories) catMap[c.slug] = c.id

  const catSlugs = ["viral-videos", "technology", "gaming", "music", "education", "viral-videos", "news", "comedy", "lifestyle", "technology", "viral-videos", "sports", "music", "entertainment", "technology", "viral-videos", "education", "lifestyle", "viral-videos", "comedy", "art", "sports", "viral-videos", "viral-videos"]
  
  for (let i = 0; i < VIDEO_TITLES.length; i++) {
    const ch = s.channels[i % s.channels.length]
    const catSlug = catSlugs[i % catSlugs.length]
    const catId = catMap[catSlug] || s.categories[0].id

    const views = Math.floor(Math.random() * 50000) + 100
    const likes = Math.floor(views * (0.02 + Math.random() * 0.08))

    const vid: DBVideo = {
      id: uuid(),
      title: VIDEO_TITLES[i],
      description: `This is an exciting video about ${VIDEO_TITLES[i].toLowerCase()}. Watch to learn more!`,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: THUMBS[i % THUMBS.length],
      channelId: ch.id,
      uploaderId: ch.ownerId || "",
      categoryId: catId,
      tags: [catSlug, "trending", "popular"],
      visibility: "public",
      views,
      likes,
      watchTime: Math.floor(views * 120),
      trendingScore: likes * 3 + views,
      isFeatured: i < 4,
      duration: randomDuration(),
      createdAt: daysAgo(Math.floor(Math.random() * 30)),
    }
    s.videos.push(vid)
    ch.videoCount++

    const cat = s.categories.find((c) => c.id === catId)
    if (cat) cat.videoCount++
  }

  s.seeded = true
}

// ── Helper lookups ────────────────────────────────────────
export function findUserById(id: string) { return getStore().users.find((u) => u.id === id) }
export function findUserByEmail(email: string) { return getStore().users.find((u) => u.email === email) }
export function findUserByUsername(username: string) { return getStore().users.find((u) => u.username === username) }
export function findChannelBySlug(slug: string) { return getStore().channels.find((c) => c.slug === slug) }
export function findChannelByOwner(ownerId: string) { return getStore().channels.find((c) => c.ownerId === ownerId) }
export function findChannelById(id: string) { return getStore().channels.find((c) => c.id === id) }
export function findVideoById(id: string) { return getStore().videos.find((v) => v.id === id) }
export function findCategoryById(id: string) { return getStore().categories.find((c) => c.id === id) }
export function findCategoryBySlug(slug: string) { return getStore().categories.find((c) => c.slug === slug) }

export { uuid }
