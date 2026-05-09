"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface ChannelData {
    _id?: string
    id?: string
    name: string
    slug: string
    logo?: string
    subscriberCount: number
}

interface PopularChannelsMarqueeProps {
    channels: ChannelData[]
}

export function PopularChannelsMarquee({ channels }: PopularChannelsMarqueeProps) {
    if (!channels || channels.length === 0) return null

    // Duplicate channels for infinite scroll effect
    const displayChannels = [...channels, ...channels, ...channels]

    return (
        <div className="relative w-full overflow-hidden py-4">
            {/* Gradient Overlays for smooth edges */}
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee flex items-center gap-6 px-4">
                {displayChannels.map((ch, idx) => (
                    <Link
                        key={`${ch._id || ch.id}-${idx}`}
                        href={`/channel/${ch.slug}`}
                        className="group flex flex-col items-center gap-2 min-w-[120px] rounded-2xl p-4 transition-all hover:bg-primary/10 hover:shadow-xl hover:shadow-primary/5 border border-transparent hover:border-primary/20"
                    >
                        <div className="relative">
                             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xl font-black text-primary transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ring-2 ring-transparent group-hover:ring-primary/40 overflow-hidden shadow-lg shadow-black/20">
                                {ch.logo ? (
                                    <img src={ch.logo} alt={ch.name} className="h-full w-full object-cover" />
                                ) : (
                                    ch.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-background scale-0 group-hover:scale-100 transition-transform duration-300">
                                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-0.5">
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[100px]">
                                {ch.name}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                {formatSubscribers(ch.subscriberCount)} SUBS
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

function formatSubscribers(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
}
