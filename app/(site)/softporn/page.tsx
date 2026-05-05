import { ShortsFeed } from "@/components/softporn/ShortsFeed"

export const metadata = {
  title: "SoftPorn - Vertical Shorts Feed",
  description: "Experience the fastest vertical video feed with SoftPorn Shorts."
}

export default function SoftPornPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-black">
      <ShortsFeed />
    </div>
  )
}
