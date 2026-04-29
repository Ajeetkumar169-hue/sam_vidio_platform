"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { 
  Drawer, 
  DrawerContent, 
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { toast } from "sonner"
import { Loader2, Info, Check } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const COUNTRY_CODES = [
  { id: "pk", code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { id: "sa", code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { id: "ae", code: "+971", flag: "🇦🇪", name: "UAE" },
  { id: "in", code: "+91", flag: "🇮🇳", name: "India" },
  { id: "us", code: "+1", flag: "🇺🇸", name: "USA" },
  { id: "uk", code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { id: "ca", code: "+1", flag: "🇨🇦", name: "Canada" },
  { id: "de", code: "+49", flag: "🇩🇪", name: "Germany" },
  { id: "fr", code: "+33", flag: "🇫🇷", name: "France" },
  { id: "tr", code: "+90", flag: "🇹🇷", name: "Turkey" },
  { id: "au", flag: "🇦🇺", code: "+61", name: "Australia" },
  { id: "jp", flag: "🇯🇵", code: "+81", name: "Japan" },
  { id: "cn", flag: "🇨🇳", code: "+86", name: "China" },
  { id: "eg", flag: "🇪🇬", code: "+20", name: "Egypt" },
  { id: "es", flag: "🇪🇸", code: "+34", name: "Spain" },
  { id: "it", flag: "🇮🇹", code: "+39", name: "Italy" },
  { id: "za", flag: "🇿🇦", code: "+27", name: "South Africa" },
  { id: "bd", flag: "🇧🇩", code: "+880", name: "Bangladesh" },
  { id: "ru", flag: "🇷🇺", code: "+7", name: "Russia" },
  { id: "br", flag: "🇧🇷", code: "+55", name: "Brazil" },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  
  // Hardened State Management
  const [open, setOpen] = useState(false)
  const [selectedCountryId, setSelectedCountryId] = useState("pk")
  const [contactNumber, setContactNumber] = useState("")
  const [gender, setGender] = useState("male")
  const [loading, setLoading] = useState(false)

  const selectedCountry = useMemo(() => 
    COUNTRY_CODES.find(c => c.id === selectedCountryId) || COUNTRY_CODES[0],
    [selectedCountryId]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 18+ Age Validation
    const dob = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) { age-- }

    if (age < 18) {
      toast.error("You must be at least 18 years old to join.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    // Combine Country Code and Number without duplication
    const cleanNumber = contactNumber.replace(/\D/g, "")
    const fullPhoneNumber = `${selectedCountry.code}${cleanNumber}`

    setLoading(true)
    const result = await register(username, email, password, dateOfBirth, fullPhoneNumber, gender)
    setLoading(false)

    if (result.success) {
      toast.success("Account created successfully!")
      router.push("/")
    } else {
      toast.error(result.error || "Registration failed")
    }
  }

  // Shared Country List Component
  const CountryList = () => (
    <Command className="bg-popover border-none h-full">
      <CommandInput 
        placeholder="Search country or code..." 
        autoFocus={!isMobile}
        className="h-12"
      />
      <CommandList className="max-h-[300px] overflow-y-auto scrollbar-hide py-2">
        <CommandEmpty className="p-4 text-center text-xs text-muted-foreground uppercase font-bold tracking-widest">
          No country found.
        </CommandEmpty>
        <CommandGroup>
          {COUNTRY_CODES.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.name} ${c.code} ${c.id}`} // Hardened filtering
              onSelect={() => {
                setSelectedCountryId(c.id)
                setOpen(false)
              }}
              className="flex items-center justify-between py-3 px-4 cursor-pointer focus:bg-primary/10 hover:bg-primary/5 rounded-lg mx-2 my-1"
            >
              <div className="flex items-center gap-4">
                 <span className="text-2xl leading-none">{c.flag}</span>
                 <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{c.name}</span>
                    <span className="text-sm font-black text-foreground">{c.code}</span>
                 </div>
              </div>
              {selectedCountryId === c.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 py-12">
      <Card className="w-full max-w-lg border-border bg-card shadow-2xl glass-panel text-left overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-primary" />
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-black uppercase tracking-tight text-foreground">Create Account</CardTitle>
          <CardDescription>Join our premium community and start sharing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Account Info Section */}
            <div className="space-y-4">
               <h3 className="text-sm font-bold uppercase tracking-widest text-primary/50 border-b border-foreground/5 pb-2">Account Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider">Username</Label>
                    <Input
                      id="username"
                      placeholder="Choice"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="bg-secondary/50 rounded-xl h-12 border-none ring-1 ring-foreground/10 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-secondary/50 rounded-xl h-12 border-none ring-1 ring-foreground/10 focus-visible:ring-primary"
                    />
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password" title="At least 6 characters" className="text-xs font-bold uppercase tracking-wider">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-secondary/50 rounded-xl h-12 border-none ring-1 ring-foreground/10 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider">Confirm</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-secondary/50 rounded-xl h-12 border-none ring-1 ring-foreground/10 focus-visible:ring-primary"
                    />
                  </div>
               </div>
            </div>

            {/* Profile Info Section */}
            <div className="space-y-4">
               <h3 className="text-sm font-bold uppercase tracking-widest text-primary/50 border-b border-foreground/5 pb-2">Personal Details</h3>
               
               <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                       <Label htmlFor="dob" className="text-xs font-bold uppercase tracking-wider">Date of Birth</Label>
                       <span className="text-[10px] text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10">18+ Only</span>
                    </div>
                    <Input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      className="bg-secondary/50 rounded-xl h-12 [appearance:none] border-none ring-1 ring-foreground/10 focus-visible:ring-primary"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contact" className="text-xs font-bold uppercase tracking-wider">Contact Number</Label>
                    <div className="flex gap-2">
                       {/* Tier-1 Responsive Searchable Selector */}
                       {isMobile ? (
                         <Drawer open={open} onOpenChange={setOpen}>
                           <DrawerTrigger asChild>
                             <button type="button" className="w-[120px] h-12 bg-secondary/50 rounded-xl ring-1 ring-foreground/10 flex items-center justify-center gap-2 px-3 transition-all active:scale-95 bg-card border-none">
                                <span className="text-xl leading-none">{selectedCountry.flag}</span>
                                <span className="font-bold text-sm text-foreground">{selectedCountry.code}</span>
                             </button>
                           </DrawerTrigger>
                           <DrawerContent className="bg-popover border-border max-h-[80vh]">
                             <DrawerHeader className="pb-2">
                               <DrawerTitle className="text-left text-xs uppercase font-black tracking-[0.2em] opacity-40">Choose Country</DrawerTitle>
                             </DrawerHeader>
                             <div className="pb-8">
                               <CountryList />
                             </div>
                           </DrawerContent>
                         </Drawer>
                       ) : (
                         <Popover open={open} onOpenChange={setOpen}>
                           <PopoverTrigger asChild>
                             <button type="button" className="w-[120px] h-12 bg-secondary/50 rounded-xl ring-1 ring-foreground/10 flex items-center justify-center gap-2 px-3 transition-all hover:ring-primary/50 bg-card border-none">
                                <span className="text-xl leading-none">{selectedCountry.flag}</span>
                                <span className="font-bold text-sm text-foreground">{selectedCountry.code}</span>
                             </button>
                           </PopoverTrigger>
                           <PopoverContent className="w-[300px] p-0 bg-popover border-border shadow-2xl rounded-2xl" align="start">
                             <CountryList />
                           </PopoverContent>
                         </Popover>
                       )}
                       
                       <Input
                         id="contact"
                         type="tel"
                         placeholder="300 1234567"
                         value={contactNumber}
                         onChange={(e) => setContactNumber(e.target.value)}
                         required
                         className="flex-1 bg-secondary/50 rounded-xl h-12 border-none ring-1 ring-foreground/10 focus-visible:ring-primary"
                       />
                    </div>
                  </div>
               </div>

               <div className="flex flex-col gap-3">
                  <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    Gender 
                  </Label>
                  <RadioGroup 
                    value={gender} 
                    onValueChange={setGender}
                    className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide"
                  >
                    {[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "lesbian", label: "Lesbian" },
                      { value: "gay", label: "Gay" }
                    ].map((opt) => (
                      <div key={opt.value} className="flex-shrink-0">
                        <RadioGroupItem
                          value={opt.value}
                          id={`gender-${opt.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`gender-${opt.value}`}
                          className="flex h-10 items-center justify-center rounded-xl bg-secondary/50 px-5 text-[10px] font-bold uppercase tracking-widest transition-all peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer hover:bg-secondary border border-foreground/5"
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
               </div>
            </div>

            <div className="pt-4">
               <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-tighter shadow-xl shadow-primary/20 active-bounce group" disabled={loading}>
                 {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Complete Registration"}
               </Button>
               
               <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-secondary/30 py-3 rounded-xl border border-foreground/5">
                  <Info className="h-3 w-3 text-primary" />
                  Your data is used for age verification & security.
               </div>
            </div>
          </form>
          
          <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
