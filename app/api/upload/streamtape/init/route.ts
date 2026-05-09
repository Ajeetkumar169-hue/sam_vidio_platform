import { NextResponse } from "next/server";

export async function GET() {
  try {
    const login = process.env.STREAMTAPE_LOGIN;
    const key = process.env.STREAMTAPE_KEY;
    
    if (!login || !key) {
      return NextResponse.json({ success: false, error: "Streamtape credentials not configured" }, { status: 500 });
    }

    const res = await fetch(`https://api.streamtape.com/file/ul?login=${login}&key=${key}`);
    const data = await res.json();

    if (data.status !== 200) {
      return NextResponse.json({ success: false, error: data.msg || "Failed to get Streamtape URL" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { url: data.result.url } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
