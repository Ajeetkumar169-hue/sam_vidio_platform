import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import bcrypt from "bcryptjs"
import User from "../lib/models/User"
import Channel from "../lib/models/Channel"

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env.local")
  process.exit(1)
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345"
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Admin"

async function setupAdmin() {
  try {
    await mongoose.connect(MONGO_URI!)
    console.log("✅ Connected to MongoDB")

    console.log(`🔍 Checking for existing admin with email: ${ADMIN_EMAIL}`)

    let user = await User.findOne({ email: ADMIN_EMAIL })

    if (user) {
      console.log("ℹ️ User found. Promoting to Admin...")
      user.role = "admin"
      user.status = "active"
      await user.save()
      console.log("✅ User successfully promoted to Admin.")
    } else {
      console.log("ℹ️ User not found. Creating new Admin account...")
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12)
      
      user = await User.create({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
        status: "active",
      })
      console.log("✅ Admin account created successfully.")
    }

    // Check for corresponding channel
    const channel = await Channel.findOne({ owner: user._id })
    if (!channel) {
      console.log("ℹ️ Creating channel for admin user...")
      const channelSlug = ADMIN_USERNAME.toLowerCase().replace(/[^a-z0-9]/g, "-")

      await Channel.create({
        owner: user._id,
        name: `${ADMIN_USERNAME}'s Channel`,
        slug: channelSlug,
        description: "Official Admin Channel",
        logo: "",
        banner: "",
        subscriberCount: 0,
        videoCount: 0,
      })
      console.log("✅ Admin Channel created successfully.")
    } else {
       console.log("✅ Admin Channel already exists.")
    }

    console.log("\n🎉 Admin setup complete! You can now log in with:")
    console.log(`📧 Email: ${ADMIN_EMAIL}`)
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`)
    
    process.exit(0)
  } catch (error) {
    console.error("❌ Setup failed:", error)
    process.exit(1)
  }
}

setupAdmin()
