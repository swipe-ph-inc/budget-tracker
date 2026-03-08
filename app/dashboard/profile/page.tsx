"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { TopHeader } from "@/components/top-header"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getProfile, updateProfile, type ProfileData } from "@/app/actions/profile"
import { toast } from "@/hooks/use-toast"
import { User } from "lucide-react"

const CURRENCIES = [
  { value: "PHP", label: "PHP" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
] as const

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [first_name, setFirstName] = useState("")
  const [last_name, setLastName] = useState("")
  const [middle_name, setMiddleName] = useState("")
  const [phone_number, setPhoneNumber] = useState("")
  const [currency, setCurrency] = useState("PHP")
  const [avatar_url, setAvatarUrl] = useState("")

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProfile()
      setData(res)
      if (res.profile) {
        setFirstName(res.profile.first_name ?? "")
        setLastName(res.profile.last_name ?? "")
        setMiddleName(res.profile.middle_name ?? "")
        setPhoneNumber(res.profile.phone_number ?? "")
        setCurrency(res.profile.currency ?? "PHP")
        setAvatarUrl(res.profile.avatar_url ?? "")
      } else {
        setCurrency("PHP")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const result = await updateProfile({
        first_name: first_name.trim() || null,
        last_name: last_name.trim() || null,
        middle_name: middle_name.trim() || null,
        phone_number: phone_number.trim() || null,
        currency: currency || null,
        avatar_url: avatar_url.trim() || null,
      })
      if (result.success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been saved.",
        })
        await loadProfile()
      } else {
        toast({
          title: "Update failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TopHeader title="Profile" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-screen-md flex flex-col gap-6 pb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account details and preferences. Email is managed in account settings.
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              Loading profile…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="rounded-xl border border-border bg-card p-5 lg:p-6">
                <div className="flex flex-col gap-5">
                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-email" className="text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={data?.email ?? ""}
                      readOnly
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Change your email in your account or authentication settings.
                    </p>
                  </div>

                  {/* First name */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-first-name">First name</Label>
                    <Input
                      id="profile-first-name"
                      type="text"
                      placeholder="First name"
                      value={first_name}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Last name */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-last-name">Last name</Label>
                    <Input
                      id="profile-last-name"
                      type="text"
                      placeholder="Last name"
                      value={last_name}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Middle name */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-middle-name">Middle name</Label>
                    <Input
                      id="profile-middle-name"
                      type="text"
                      placeholder="Middle name (optional)"
                      value={middle_name}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Phone number */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">Phone number</Label>
                    <Input
                      id="profile-phone"
                      type="tel"
                      placeholder="+63 912 345 6789"
                      value={phone_number}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-currency">Preferred currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="profile-currency" className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used as default for new accounts and displays where no currency is set.
                    </p>
                  </div>

                  {/* Avatar URL */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-avatar">Avatar URL</Label>
                    <Input
                      id="profile-avatar"
                      type="url"
                      placeholder="https://…"
                      value={avatar_url}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional. Link to a profile image.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                  <div className="text-xs text-muted-foreground">
                    {data?.profile?.updated_at && (
                      <span>Last updated: {formatDate(data.profile.updated_at)}</span>
                    )}
                    {data?.profile?.created_at && !data?.profile?.updated_at && (
                      <span>Created: {formatDate(data.profile.created_at)}</span>
                    )}
                  </div>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save profile"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Profile summary card (optional) */}
          {data?.profile && (data.profile.first_name || data.profile.last_name) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent">
                  {data.profile.avatar_url ? (
                    <img
                      src={data.profile.avatar_url}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-7 w-7 text-accent-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {[data.profile.first_name, data.profile.middle_name, data.profile.last_name]
                      .filter(Boolean)
                      .join(" ") || "No name set"}
                  </p>
                  {data.profile.phone_number && (
                    <p className="text-sm text-muted-foreground">{data.profile.phone_number}</p>
                  )}
                  {data.profile.currency && (
                    <p className="text-xs text-muted-foreground">
                      Preferred currency: {data.profile.currency}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
