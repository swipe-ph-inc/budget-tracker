"use client"

import { useCallback, useEffect, useState } from "react"
import { Pencil, Plus, Trash } from "lucide-react"
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
  getMerchantsWithCategories,
  getMerchantCategories,
  registerMerchant,
  updateMerchant,
  deleteMerchant,
  type MerchantWithCategory,
  type MerchantCategoryOption,
} from "@/app/actions/merchants"
import { toast } from "@/hooks/use-toast"

export type ManageMerchantsPanelProps = {
  onCompleted?: () => void
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function ManageMerchantsPanel({ onCompleted }: ManageMerchantsPanelProps) {
  const [merchants, setMerchants] = useState<MerchantWithCategory[]>([])
  const [categories, setCategories] = useState<MerchantCategoryOption[]>([])
  const [loading, setLoading] = useState(false)
  const [addName, setAddName] = useState("")
  const [addCategoryId, setAddCategoryId] = useState("")
  const [addStatus, setAddStatus] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editCategoryId, setEditCategoryId] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [merchantsData, categoriesData] = await Promise.all([
        getMerchantsWithCategories(),
        getMerchantCategories(),
      ])
      setMerchants(merchantsData)
      setCategories(categoriesData)
      setAddCategoryId((prev) => (prev ? prev : categoriesData[0]?.id ?? ""))
    } catch {
      toast({
        title: "Failed to load merchants",
        description: "There was a problem fetching merchants. Please try again.",
        variant: "destructive",
      })
      setMerchants([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddMerchant = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = addName.trim()
    if (!trimmed) {
      setAddStatus({ type: "error", message: "Merchant name is required." })
      return
    }
    if (!addCategoryId) {
      setAddStatus({ type: "error", message: "Category is required." })
      return
    }

    setIsAdding(true)
    setAddStatus(null)
    const result = await registerMerchant(trimmed, addCategoryId)
    if (result.success) {
      setAddStatus({ type: "success", message: "Merchant added successfully." })
      setAddName("")
      onCompleted?.()
      fetchData()
      setTimeout(() => setAddStatus(null), 3000)
    } else {
      setAddStatus({ type: "error", message: result.error })
    }
    setIsAdding(false)
  }

  const startEdit = (m: MerchantWithCategory) => {
    setEditingId(m.id)
    setEditName(m.name)
    setEditCategoryId(m.category_id)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditCategoryId("")
  }

  const handleUpdateMerchant = async () => {
    if (!editingId) return
    const trimmed = editName.trim()
    if (!trimmed) {
      toast({
        title: "Validation error",
        description: "Merchant name is required.",
        variant: "destructive",
      })
      return
    }
    if (!editCategoryId) {
      toast({
        title: "Validation error",
        description: "Category is required.",
        variant: "destructive",
      })
      return
    }

    const result = await updateMerchant(editingId, trimmed, editCategoryId)
    if (result.success) {
      toast({
        title: "Merchant updated",
        description: "Changes saved successfully.",
      })
      onCompleted?.()
      cancelEdit()
      fetchData()
    } else {
      toast({
        title: "Failed to update merchant",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleDeleteMerchant = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    const result = await deleteMerchant(deleteId)
    if (result.success) {
      toast({
        title: "Merchant deleted",
        description: "Merchant removed successfully.",
      })
      onCompleted?.()
      setDeleteId(null)
      fetchData()
    } else {
      toast({
        title: "Failed to delete merchant",
        description: result.error,
        variant: "destructive",
      })
      setDeleteId(null)
    }
    setIsDeleting(false)
  }

  return (
    <>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-card-foreground">
          Manage merchants
        </h2>
        <p className="text-sm text-muted-foreground">
          View, add, edit, and remove merchants. Merchants are used for payments
          and invoices.
        </p>
      </div>

      <form
        onSubmit={handleAddMerchant}
        className="flex flex-col gap-3 border-b border-border pb-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="add-merchant-name">Merchant Name</Label>
            <Input
              id="add-merchant-name"
              placeholder="e.g. Netflix, Spotify"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              disabled={isAdding}
              aria-describedby="add-merchant-hint"
            />
          </div>
          <div className="w-full min-w-0 space-y-2 sm:w-auto sm:min-w-[160px]">
            <Label htmlFor="add-merchant-category">Category</Label>
            <Select
              value={addCategoryId}
              onValueChange={setAddCategoryId}
              disabled={isAdding || categories.length === 0}
            >
              <SelectTrigger id="add-merchant-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            size="default"
            disabled={isAdding || categories.length === 0}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </div>
        <p id="add-merchant-hint" className="text-xs text-muted-foreground">
          Name of the payee or vendor
        </p>
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

      <div className="min-h-0 min-w-0 overflow-auto rounded-lg border border-border">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Loading merchants...
          </div>
        ) : merchants.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <p>No merchants yet.</p>
            <p className="text-xs">Add a merchant using the form above.</p>
          </div>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {merchants.map((m) =>
                  editingId === m.id ? (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                          autoFocus
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editCategoryId}
                          onValueChange={setEditCategoryId}
                        >
                          <SelectTrigger className="h-8 min-w-0 w-full sm:w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCreatedAt(m.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={handleUpdateMerchant}
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
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.category_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCreatedAt(m.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEdit(m)}
                            aria-label="Edit merchant"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(m.id)}
                            aria-label="Delete merchant"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete merchant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this merchant? Payments and invoices
              linked to this merchant may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteMerchant()
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

