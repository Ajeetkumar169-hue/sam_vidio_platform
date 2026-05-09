import connectDB from "@/lib/db"
import Actor from "@/lib/models/Actor"
import Video from "@/lib/models/Video"
import { VideoCard } from "@/components/video-card"
import { notFound } from "next/navigation"
import { Camera, Film, Users, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function ActorProfilePage({ params }: { params: { slug: string } }) {
    await connectDB()
    const actor = await Actor.findOne({ slug: params.slug }).lean()
    
    if (!actor) return notFound()

    const videos = await Video.find({ 
        actors: actor._id,
        status: "approved",
        isDeleted: { $ne: true }
    }).sort({ createdAt: -1 }).lean()

    return (
        <div className="min-h-screen pb-20">
            {/* Header / Hero Section */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background z-0" />
                <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-end p-6 md:p-10 gap-4">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                        <div className="h-32 w-32 md:h-48 md:w-48 rounded-2xl overflow-hidden border-4 border-background shadow-2xl shrink-0 bg-muted">
                            {actor.avatar ? (
                                <img src={actor.avatar} alt={actor.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <Camera className="h-12 w-12 text-muted-foreground/20" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl md:text-5xl font-black tracking-tighter">{actor.name}</h1>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px]">Performer</Badge>
                            </div>
                            <p className="text-muted-foreground text-sm md:text-base max-w-2xl line-clamp-3">
                                {actor.bio || "No biography available for this performer."}
                            </p>
                            <div className="flex items-center gap-6 pt-2">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Videos</span>
                                    <span className="text-xl font-bold">{videos.length}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Joined</span>
                                    <span className="text-xl font-bold italic">{new Date(actor.createdAt).getFullYear()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Videos Grid */}
            <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
                <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
                    <div className="flex items-center gap-3">
                        <Film className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold tracking-tight uppercase tracking-[0.2em] text-xs">Featured Content</h2>
                    </div>
                </div>

                {videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                            <Film className="h-10 w-10 text-muted-foreground/20" />
                        </div>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No videos found for this actor.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {videos.map((video: any) => (
                            <VideoCard key={video._id.toString()} video={JSON.parse(JSON.stringify(video))} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
