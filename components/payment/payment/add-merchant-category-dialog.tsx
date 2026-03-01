"use client"

import { useState } from "react"
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
import { SuccessMessage, ErrorMessage } from "@/components/ui/status-message"
import { registerMerchantCategory } from "@/app/actions/merchants"
import { toast } from "@/hooks/use-toast"

interface AddMerchantCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

export function AddMerchantCategoryDialog({
  open,
  onOpenChange,
  onCompleted,
}: AddMerchantCategoryDialogProps) {
  const [name, setName] = useState("")
  const [status, setStatus] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setStatus({ type: "error", message: "Category name is required." })
      return
    }

    setIsSubmitting(true)
    setStatus(null)
    const result = await registerMerchantCategory(trimmed)

    if (result.success) {
      toast({ title: "Category added", description: "Merchant category created successfully." })
      setName("")
      setStatus(null)
      onCompleted?.()
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
          <DialogTitle>Add Merchant Category</DialogTitle>
          <DialogDescription>
            Create a new category for organizing merchants (e.g. Utilities, Healthcare).
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
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              placeholder="e.g. Utilities, Healthcare"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
