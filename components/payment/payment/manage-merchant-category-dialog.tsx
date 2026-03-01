"use client"

import { useCallback, useEffect, useState } from "react"
import { Pencil, Plus, Trash } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SuccessMessage, ErrorMessage } from "@/components/ui/status-message"
import {
  getMerchantCategories,
  registerMerchantCategory,
  updateMerchantCategory,
  deleteMerchantCategory,
  type MerchantCategoryOption,
} from "@/app/actions/merchants"
import { toast } from "@/hooks/use-toast"

interface ManageMerchantCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

export function ManageMerchantCategoryDialog({
  open,
  onOpenChange,
  onCompleted,
}: ManageMerchantCategoryDialogProps) {
  const [categories, setCategories] = useState<MerchantCategoryOption[]>([])
  const [loading, setLoading] = useState(false)
  const [addName, setAddName] = useState("")
  const [addStatus, setAddStatus] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMerchantCategories()
      setCategories(data ?? [])
    } catch {
      toast({
        title: "Failed to load categories",
        description: "There was a problem fetching categories. Please try again.",
        variant: "destructive",
      })
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setAddName("")
      setAddStatus(null)
      setEditingId(null)
      setDeleteId(null)
      fetchData()
    }
  }, [open, fetchData])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = addName.trim()
    if (!trimmed) {
      setAddStatus({ type: "error", message: "Category name is required." })
      return
    }

    setIsAdding(true)
    setAddStatus(null)
    const result = await registerMerchantCategory(trimmed)
    if (result.success) {
      setAddStatus({ type: "success", message: "Category added successfully." })
      setAddName("")
      onCompleted?.()
      fetchData()
      setTimeout(() => setAddStatus(null), 3000)
    } else {
      setAddStatus({ type: "error", message: result.error })
    }
    setIsAdding(false)
  }

  const startEdit = (c: MerchantCategoryOption) => {
    setEditingId(c.id)
    setEditName(c.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
  }

  const handleUpdateCategory = async () => {
    if (!editingId) return
    const trimmed = editName.trim()
    if (!trimmed) {
      toast({
        title: "Validation error",
        description: "Category name is required.",
        variant: "destructive",
      })
      return
    }

    const result = await updateMerchantCategory(editingId, trimmed)
    if (result.success) {
      toast({ title: "Category updated", description: "Changes saved successfully." })
      onCompleted?.()
      cancelEdit()
      fetchData()
    } else {
      toast({
        title: "Failed to update category",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    const result = await deleteMerchantCategory(deleteId)
    if (result.success) {
      toast({ title: "Category deleted", description: "Category removed successfully." })
      onCompleted?.()
      setDeleteId(null)
      fetchData()
    } else {
      toast({
        title: "Failed to delete category",
        description: result.error,
        variant: "destructive",
      })
      setDeleteId(null)
    }
    setIsDeleting(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-[95vw] flex-col sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Manage Merchant Categories</DialogTitle>
            <DialogDescription>
              View, add, edit, and remove categories. Categories organize merchants (e.g. Utilities, Healthcare).
            </DialogDescription>
          </DialogHeader>

          {/* Add category form */}
          <form
            onSubmit={handleAddCategory}
            className="flex flex-col gap-3 border-b border-border pb-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="add-category-name">Category Name</Label>
                <Input
                  id="add-category-name"
                  placeholder="e.g. Utilities, Healthcare"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  disabled={isAdding}
                />
              </div>
              <Button type="submit" size="default" disabled={isAdding}>
                <Plus className="mr-1.5 h-4 w-4" />
                {isAdding ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>

          {addStatus && (
            <div>
              {addStatus.type === "success" ? (
                <SuccessMessage message={addStatus.message} />
              ) : (
                <ErrorMessage message={addStatus.message} />
              )}
            </div>
          )}

          {/* Categories table */}
          <div className="min-h-0 flex-1 min-w-0 overflow-auto rounded-lg border border-border">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                <p>No categories yet.</p>
                <p className="text-xs">Add a category using the form above.</p>
              </div>
            ) : (
              <div className="min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) =>
                    editingId === c.id ? (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={handleUpdateCategory}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEdit(c)}
                              aria-label="Edit category"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(c.id)}
                              aria-label="Delete category"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? Merchants in this category must be moved or deleted first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteCategory()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
