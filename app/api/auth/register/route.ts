import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import Channel from "@/lib/models/Channel"
import { hashPassword, generateToken } from "@/lib/auth"
import { AuthRegisterSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const parsed = AuthRegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { username, email, password, dateOfBirth, phoneNumber, gender } = parsed.data

    // Check if user exists in MongoDB
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    })
    
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    
    // Create user in MongoDB
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      dateOfBirth: new Date(dateOfBirth),
      phoneNumber,
      gender,
      role: "user",
      status: "active"
    })

    const userId = user._id.toString()
    const channelSlug = username.toLowerCase().replace(/[^a-z0-9]/g, "-")

    // Create channel in MongoDB
    await Channel.create({
      owner: user._id,
      name: username,
      slug: channelSlug,
      description: `Welcome to ${username}'s channel!`,
      logo: "",
      banner: "",
      subscriberCount: 0,
      videoCount: 0,
    })

    const token = generateToken({ 
      userId, 
      email: user.email, 
      username: user.username, 
      role: user.role 
    })

    const response = NextResponse.json({
      user: { id: userId, username: user.username, email: user.email, role: user.role },
    })
    
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error: any) {
    console.error("❌ Register error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
