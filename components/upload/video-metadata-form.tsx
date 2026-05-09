"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { X, Check, ChevronsUpDown, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

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
    const [open, setOpen] = useState(false)

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
                        <Label className="text-base font-bold">Actors</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="h-12 w-full justify-between bg-secondary/30 border-none rounded-xl hover:bg-secondary/40 text-left font-normal"
                                >
                                    <span className="truncate">
                                        {data.actors?.length > 0 
                                            ? `${data.actors.length} selected`
                                            : "Select actors..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 border-none bg-card rounded-2xl shadow-2xl overflow-hidden" align="start">
                                <Command className="bg-transparent">
                                    <CommandInput placeholder="Search actor..." className="h-12 border-none focus:ring-0" />
                                    <CommandList className="platinum-scrollbar">
                                        <CommandEmpty>No actor found.</CommandEmpty>
                                        <CommandGroup>
                                            {actors.map((actor) => (
                                                <CommandItem
                                                    key={actor._id}
                                                    value={actor.name}
                                                    onSelect={() => toggleActor(actor._id)}
                                                    className="flex items-center gap-2 p-2 rounded-xl cursor-pointer"
                                                >
                                                    <div className={cn(
                                                        "flex h-4 w-4 items-center justify-center rounded border border-primary transition-colors",
                                                        data.actors?.includes(actor._id) ? "bg-primary text-primary-foreground" : "opacity-50"
                                                    )}>
                                                        {data.actors?.includes(actor._id) && <Check className="h-3 w-3" />}
                                                    </div>
                                                    <span className="flex-1 text-sm font-medium">{actor.name}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Selected Actors Badges Below */}
                {data.actors?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {data.actors.map(id => {
                            const actor = actors.find(a => a._id === id)
                            return actor ? (
                                <Badge key={id} variant="secondary" className="pl-3 pr-1 py-1 gap-1 rounded-full bg-primary/10 text-primary border-primary/20">
                                    {actor.name}
                                    <button onClick={() => toggleActor(id)} className="hover:bg-primary/20 rounded-full p-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ) : null
                        })}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
            </div>
        </div>
    )
}
