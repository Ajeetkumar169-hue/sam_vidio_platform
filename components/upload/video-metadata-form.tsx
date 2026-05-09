"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface Category {
    _id?: string;
    id?: string;
    name: string;
}

interface Actor {
    _id: string;
    name: string;
}

interface VideoMetadataFormProps {
    data: {
        title: string;
        description: string;
        categoryId: string;
        tags: string;
        actors: string[];
        visibility: string;
    };
    onChange: (field: string, value: any) => void;
    categories: Category[];
    actors: Actor[];
}

export function VideoMetadataForm({ data, onChange, categories, actors }: VideoMetadataFormProps) {
    const toggleActor = (actorId: string) => {
        const current = data.actors || []
        if (current.includes(actorId)) {
            onChange("actors", current.filter(id => id !== actorId))
        } else {
            onChange("actors", [...current, actorId])
        }
    }
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="title" className="text-base font-bold">Title *</Label>
                    <Input
                        id="title"
                        placeholder="Catchy title for your video"
                        value={data.title}
                        onChange={(e) => onChange("title", e.target.value)}
                        className="h-12 bg-secondary/30 border-none rounded-xl focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="description" className="text-base font-bold">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="What's your video about?"
                        value={data.description}
                        onChange={(e) => onChange("description", e.target.value)}
                        className="bg-secondary/30 border-none rounded-xl min-h-[120px] resize-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <Label className="text-base font-bold">Category *</Label>
                        <Select value={data.categoryId} onValueChange={(v) => onChange("categoryId", v)}>
                            <SelectTrigger className="h-12 bg-secondary/30 border-none rounded-xl">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {categories.map((cat) => (
                                    <SelectItem key={cat._id || cat.id} value={(cat._id || cat.id)!} className="rounded-lg">
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label className="text-base font-bold">Visibility</Label>
                        <Select value={data.visibility} onValueChange={(v) => onChange("visibility", v)}>
                            <SelectTrigger className="h-12 bg-secondary/30 border-none rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="public" className="rounded-lg">Public</SelectItem>
                                <SelectItem value="private" className="rounded-lg">Private</SelectItem>
                                <SelectItem value="unlisted" className="rounded-lg">Unlisted</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="tags" className="text-base font-bold">Tags</Label>
                    <Input
                        id="tags"
                        placeholder="funny, viral, tutorial"
                        value={data.tags}
                        onChange={(e) => onChange("tags", e.target.value)}
                        className="h-12 bg-secondary/30 border-none rounded-xl focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label className="text-base font-bold text-primary">Actors (Select one or more)</Label>
                    <div className="border border-border/50 rounded-2xl bg-secondary/20 p-4 space-y-4">
                        {/* Selected Actors Badges */}
                        <div className="flex flex-wrap gap-2">
                            {data.actors?.length > 0 ? (
                                data.actors.map(id => {
                                    const actor = actors.find(a => a._id === id)
                                    return actor ? (
                                        <Badge key={id} variant="secondary" className="pl-3 pr-1 py-1 gap-1 rounded-full bg-primary/10 text-primary border-primary/20">
                                            {actor.name}
                                            <button onClick={() => toggleActor(id)} className="hover:bg-primary/20 rounded-full p-0.5">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ) : null
                                })
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No actors selected</p>
                            )}
                        </div>

                        {/* Actor Selection List */}
                        <ScrollArea className="h-[150px] pr-4">
                            <div className="grid grid-cols-2 gap-2">
                                {actors.map(actor => (
                                    <div 
                                        key={actor._id} 
                                        className={`flex items-center space-x-3 p-2 rounded-xl transition-colors cursor-pointer hover:bg-secondary/40 ${data.actors?.includes(actor._id) ? "bg-primary/5" : ""}`}
                                        onClick={() => toggleActor(actor._id)}
                                    >
                                        <Checkbox 
                                            id={`actor-${actor._id}`} 
                                            checked={data.actors?.includes(actor._id)}
                                            onCheckedChange={() => {}} // Handled by div onClick
                                            className="rounded-md"
                                        />
                                        <label htmlFor={`actor-${actor._id}`} className="text-sm font-medium leading-none cursor-pointer">
                                            {actor.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </div>
    )
}
