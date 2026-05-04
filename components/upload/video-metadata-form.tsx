"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Category {
    _id?: string;
    id?: string;
    name: string;
}

interface VideoMetadataFormProps {
    data: {
        title: string;
        description: string;
        categoryId: string;
        tags: string;
        visibility: string;
    };
    onChange: (field: string, value: string) => void;
    categories: Category[];
}

export function VideoMetadataForm({ data, onChange, categories }: VideoMetadataFormProps) {
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
            </div>
        </div>
    )
}
