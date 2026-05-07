"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Settings } from "lucide-react"
import { toast } from "sonner"

interface ChannelSettingsDialogProps {
  channel: {
    name: string
    slug: string
    description: string
    logo: string
    banner: string
  }
  onUpdate: (updatedChannel: any) => void
}

export function ChannelSettingsDialog({ channel, onUpdate }: ChannelSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(channel.name)
  const [description, setDescription] = useState(channel.description)
  const [logo, setLogo] = useState(channel.logo)
  const [banner, setBanner] = useState(channel.banner)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/channels/${channel.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, logo, banner }),
      })
      if (!res.ok) throw new Error("Failed")
      
      const updated = { ...channel, name, description, logo, banner }
      onUpdate(updated)
      toast.success("Channel updated!")
      setOpen(false)
    } catch {
      toast.error("Failed to update channel")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-full border-white/10 hover:bg-white/5 h-10 px-6 font-bold uppercase tracking-widest text-[10px]">
          <Settings className="h-3.5 w-3.5" />
          Manage Channel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] glass-heavy border-white/10 rounded-3xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">Channel Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Channel Name</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="bg-secondary/50 border-white/5 h-12 rounded-xl focus:ring-primary/20" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows={4} 
              className="bg-secondary/50 border-white/5 rounded-xl focus:ring-primary/20 resize-none" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logo URL</Label>
            <Input 
              value={logo} 
              onChange={(e) => setLogo(e.target.value)} 
              placeholder="https://..." 
              className="bg-secondary/50 border-white/5 h-12 rounded-xl focus:ring-primary/20" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Banner URL</Label>
            <Input 
              value={banner} 
              onChange={(e) => setBanner(e.target.value)} 
              placeholder="https://..." 
              className="bg-secondary/50 border-white/5 h-12 rounded-xl focus:ring-primary/20" 
            />
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="h-12 rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 active-bounce"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
