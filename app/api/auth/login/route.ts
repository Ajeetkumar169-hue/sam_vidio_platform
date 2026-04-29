import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import { verifyPassword, generateToken } from "@/lib/auth"
import { AuthLoginSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const parsed = AuthLoginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { email, password } = parsed.data

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password!)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const userId = user._id.toString()

    const token = generateToken({
      userId,
      email: user.email,
      username: user.username,
      role: user.role,
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
    console.error("❌ Login error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
