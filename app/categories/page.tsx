"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Grid3X3, Film } from "lucide-react"

interface Category {
  _id?: string
  id?: string
  name: string
  slug: string
  description: string
  videoCount: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-screen-xl mx-auto px-2 sm:px-4 md:px-6 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Grid3X3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">All Categories</h1>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-center text-muted-foreground">No categories available yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat._id || cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-secondary"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Film className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{cat.description}</p>
              )}
              <p className="mt-auto pt-3 text-xs text-muted-foreground">
                {cat.videoCount} {cat.videoCount === 1 ? "video" : "videos"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
