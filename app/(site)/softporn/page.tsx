import { ShortsFeed } from "@/components/softporn/ShortsFeed"

export const metadata = {
  title: "Shorts - Vertical Video Feed",
  description: "Experience the fastest vertical video feed with Shorts."
}

export default function SoftPornPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-black">
      <ShortsFeed />
    </div>
  )
}
