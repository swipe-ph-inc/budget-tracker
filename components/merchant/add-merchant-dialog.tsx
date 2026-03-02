"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { SuccessMessage, ErrorMessage } from "@/components/ui/status-message"
import { getMerchantCategories, registerMerchant, type MerchantCategoryOption } from "@/app/actions/merchants"
import { toast } from "@/hooks/use-toast"

interface AddMerchantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded?: (merchantId: string) => void
}

export function AddMerchantDialog({
  open,
  onOpenChange,
  onAdded,
}: AddMerchantDialogProps) {
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categories, setCategories] = useState<MerchantCategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const data = await getMerchantCategories()
      setCategories(data ?? [])
      setCategoryId((prev) => {
        const next = data?.[0]?.id ?? ""
        return prev || next
      })
    } catch {
      toast({
        title: "Failed to load categories",
        description: "Could not load merchant categories.",
        variant: "destructive",
      })
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open, fetchCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setStatus({ type: "error", message: "Merchant name is required." })
      return
    }
    if (!categoryId) {
      setStatus({ type: "error", message: "Category is required." })
      return
    }

    setIsSubmitting(true)
    setStatus(null)
    const result = await registerMerchant(trimmed, categoryId)

    if (result.success) {
      toast({ title: "Merchant added", description: `${trimmed} has been added successfully.` })
      setName("")
      setStatus(null)
      onAdded?.(result.data.id)
      onOpenChange(false)
    } else {
      setStatus({ type: "error", message: result.error })
    }
    setIsSubmitting(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("")
      setStatus(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Merchant</DialogTitle>
          <DialogDescription>
            Create a new merchant so you can add installments or subscriptions linked to this card.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {status &&
            (status.type === "success" ? (
              <SuccessMessage message={status.message} />
            ) : (
              <ErrorMessage message={status.message} />
            ))}
          <div className="space-y-2">
            <Label htmlFor="merchant-name">Merchant Name</Label>
            <Input
              id="merchant-name"
              placeholder="e.g. Samsung, Netflix, Gym"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="merchant-category">Category</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={categoriesLoading || isSubmitting}
            >
              <SelectTrigger id="merchant-category">
                <SelectValue
                  placeholder={
                    categoriesLoading ? "Loading..." : categories.length === 0 ? "No categories" : "Select category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length === 0 && !categoriesLoading && (
              <p className="text-xs text-muted-foreground">
                No categories yet. Add categories from Account → Manage merchants first.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || categories.length === 0}>
              {isSubmitting ? "Adding..." : "Add Merchant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
