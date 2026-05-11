import SiteLayoutClient from "./SiteLayoutClient"

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SiteLayoutClient>
      {children}
    </SiteLayoutClient>
  )
}
