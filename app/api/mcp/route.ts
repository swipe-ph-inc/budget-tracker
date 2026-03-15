import { z } from "zod"
import { createMcpHandler } from "mcp-handler"
import { getDashboardStats } from "@/app/actions/dashboard"
import { getAccounts } from "@/app/actions/accounts"
import { getSavingPlans, createSavingPlan, updateSavingPlan, deleteSavingPlan, addContribution } from "@/app/actions/saving-plans"
import { createTopUp, createTransfer, createTransferToRecipient, createPayment } from "@/app/actions/transaction"
import { getRecipients, createRecipient } from "@/app/actions/recipient"
import { getMerchants, getMerchantCategories, registerMerchant } from "@/app/actions/merchants"

export const maxDuration = 30

const handler = createMcpHandler(
  (server) => {
    // ─── READ TOOLS ────────────────────────────────────────────────────────────

    server.tool(
      "get_dashboard_stats",
      "Get the user's dashboard summary: total income, total expense, total savings, and currency for the current year.",
      {},
      async () => {
        const stats = await getDashboardStats()
        return { content: [{ type: "text" as const, text: JSON.stringify(stats, null, 2) }] }
      }
    )

    server.tool(
      "list_accounts",
      "List the user's active accounts (id, name, balance, currency, type). Always call this first when you need an account ID for a transaction.",
      {},
      async () => {
        const accounts = await getAccounts()
        const summary = (accounts ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          balance: a.balance,
          currency: a.currency,
          account_type: a.account_type,
        }))
        return { content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }] }
      }
    )

    server.tool(
      "list_saving_plans",
      "List the user's saving plans with id, current amount, target amount, target date, and status. Use for savings-related questions.",
      {},
      async () => {
        const plans = await getSavingPlans()
        return { content: [{ type: "text" as const, text: JSON.stringify(plans ?? [], null, 2) }] }
      }
    )

    server.tool(
      "get_recent_transactions",
      "Get the user's recent transactions (income, payments, transfers) for the dashboard. Optional limit (default 10).",
      { limit: z.number().int().min(1).max(50).optional() },
      async ({ limit }) => {
        const { getRecentTransactionsForDashboard } = await import("@/app/actions/dashboard")
        const items = await getRecentTransactionsForDashboard(limit ?? 10)
        return { content: [{ type: "text" as const, text: JSON.stringify(items, null, 2) }] }
      }
    )

    server.tool(
      "list_recipients",
      "List the user's saved recipients (id, display_name, account_number, bank_name). Call this before creating a transfer to a recipient to find the recipient ID.",
      {},
      async () => {
        const result = await getRecipients()
        if (!result.success) return { content: [{ type: "text" as const, text: JSON.stringify({ error: result.error }) }] }
        const summary = result.data.map((r) => ({
          id: r.id,
          display_name: r.display_name,
          account_number: r.account_number,
          bank_name: r.bank_name,
          currency: r.currency,
        }))
        return { content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }] }
      }
    )

    server.tool(
      "list_merchants",
      "List all merchants (id, name). Call this before creating a payment to find the merchant ID.",
      {},
      async () => {
        const merchants = await getMerchants()
        return { content: [{ type: "text" as const, text: JSON.stringify(merchants, null, 2) }] }
      }
    )

    server.tool(
      "list_merchant_categories",
      "List all merchant categories (id, name). Call this before registering a new merchant to find the category ID.",
      {},
      async () => {
        const categories = await getMerchantCategories()
        return { content: [{ type: "text" as const, text: JSON.stringify(categories, null, 2) }] }
      }
    )

    // ─── WRITE TOOLS ───────────────────────────────────────────────────────────

    server.tool(
      "record_income",
      "Record income or a top-up into one of the user's accounts. Use this when the user says they received money, got paid, or wants to add funds to an account.",
      {
        accountId: z.string().describe("ID of the account to credit. Use list_accounts to find it."),
        amount: z.number().positive().describe("Amount to add."),
        currency: z.string().describe("Currency code, e.g. PHP, USD."),
        note: z.string().optional().describe("Optional note or description."),
      },
      async ({ accountId, amount, currency, note }) => {
        const result = await createTopUp({ accountId, amount, currency, note })
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] }
      }
    )

    server.tool(
      "create_transfer",
      "Transfer funds between two of the user's own accounts. Debits fromAccount and credits toAccount. Use list_accounts to find account IDs first.",
      {
        fromAccountId: z.string().describe("ID of the source account."),
        toAccountId: z.string().describe("ID of the destination account."),
        amount: z.number().positive().describe("Amount to transfer."),
        currency: z.string().optional().describe("Currency code. Defaults to the source account currency."),
        note: z.string().optional().describe("Optional note."),
        transferMethod: z.enum(["instaPay", "pesoNet", "wire", "cash"]).optional().describe("Transfer method. Defaults to instaPay."),
        transferType: z.enum(["local", "international"]).optional().describe("Transfer type. Defaults to local."),
        feeAmount: z.number().min(0).optional().describe("Optional fee amount."),
      },
      async ({ fromAccountId, toAccountId, amount, currency, note, transferMethod, transferType, feeAmount }) => {
        const result = await createTransfer({ fromAccountId, toAccountId, amount, currency, note, transferMethod, transferType, feeAmount })
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] }
      }
    )

    server.tool(
      "create_transfer_to_recipient",
      "Send funds from one of the user's accounts to a saved recipient. Use list_accounts and list_recipients to find IDs first.",
      {
        fromAccountId: z.string().describe("ID of the source account."),
        toRecipientId: z.string().describe("ID of the recipient. Use list_recipients to find it."),
        amount: z.number().positive().describe("Amount to send."),
        currency: z.string().optional().describe("Currency code. Defaults to the source account currency."),
        note: z.string().optional().describe("Optional note."),
        reference: z.string().optional().describe("Optional reference number."),
        transferMethod: z.enum(["instaPay", "pesoNet", "wire", "cash"]).optional().describe("Transfer method. Defaults to instaPay."),
        transferType: z.enum(["local", "international"]).optional().describe("Transfer type. Defaults to local."),
        feeAmount: z.number().min(0).optional().describe("Optional fee amount."),
      },
      async ({ fromAccountId, toRecipientId, amount, currency, note, reference, transferMethod, transferType, feeAmount }) => {
        const result = await createTransferToRecipient({ fromAccountId, toRecipientId, amount, currency, note, reference, transferMethod, transferType, feeAmount })
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] }
      }
    )

    server.tool(
      "create_payment",
      "Record a payment to a merchant from an account or credit card. Use list_accounts and list_merchants to find IDs first.",
      {
        merchantId: z.string().describe("ID of the merchant. Use list_merchants to find it."),
        amount: z.number().positive().describe("Amount to pay."),
        fromAccountId: z.string().optional().describe("ID of the account to pay from. Provide either this or fromCreditCardId, not both."),
        fromCreditCardId: z.string().optional().describe("ID of the credit card to pay from. Provide either this or fromAccountId, not both."),
        currency: z.string().optional().describe("Currency code. Defaults to the account/card currency."),
        note: z.string().optional().describe("Optional note."),
        isRecurring: z.boolean().optional().describe("Whether this is a recurring payment."),
        recurrenceFrequency: z.enum(["weekly", "biweekly", "monthly"]).optional().describe("Required if isRecurring is true."),
        feeAmount: z.number().min(0).optional().describe("Optional fee amount."),
      },
      async ({ merchantId, amount, fromAccountId, fromCreditCardId, currency, note, isRecurring, recurrenceFrequency, feeAmount }) => {
        const result = await createPayment({ merchantId, amount, fromAccountId, fromCreditCardId, currency, note, isRecurring, recurrenceFrequency, feeAmount })
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] }
      }
    )

    server.tool(
      "create_saving_plan",
      "Create a new saving plan for the user with a name, target amount, and optional target date.",
      {
        name: z.string().describe("Name of the saving plan, e.g. 'Emergency Fund', 'Vacation'."),
        target_amount: z.number().positive().describe("Target amount to save."),
        target_date: z.string().optional().describe("Optional target date in YYYY-MM-DD format."),
        account_id: z.string().optional().describe("Optional account ID to link the plan to. Use list_accounts to find it."),
        currency: z.string().optional().describe("Currency code. Defaults to PHP."),
      },
      async ({ name, target_amount, target_date, account_id, currency }) => {
        const result = await createSavingPlan({ name, target_amount, target_date, account_id, currency })
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] }
      }
    )

    server.tool(
      "update_saving_plan",
      "Update an existing saving plan's name, target amount, target date, or linked account. Use list_saving_plans to find the plan ID.",
      {
        planId: z.string().describe("ID of the saving plan to update. Use list_saving_plans to find it."),
        name: z.string().optional().describe("New name for the plan."),
        target_amount: z.number().positive().optional().describe("New target amount."),
        target_date: z.string().nullable().optional().describe("New target date in YYYY-MM-DD format, or null to clear it."),
        account_id: z.string().nullable().optional().describe("New linked account ID, or null to unlink."),
        currency: z.string().optional().describe("New currency code."),
      },
      async ({ planId, name, target_amount, target_date, account_id, currency }) => {
        const result = await updateSavingPlan(planId, { name, target_amount, target_date, account_id, currency })
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] }
      }
    )

    server.tool(
      "delete_saving_plan",
      "Permanently delete a saving plan and all its contributions. This cannot be undone. Always confirm with the user before calling this. Use list_saving_plans to find the plan ID.",
      {
        planId: z.string().describe("ID of the saving plan to delete."),
      },
      async ({ planId }) => {
        const result = await deleteSavingPlan(planId)
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] }
      }
    )

    server.tool(
      "add_saving_contribution",
      "Add a contribution (deposit) or withdrawal to a saving plan to track progress. Use list_saving_plans to find the plan ID.",
      {
        saving_plan_id: z.string().describe("ID of the saving plan. Use list_saving_plans to find it."),
        amount: z.number().positive().describe("Amount contributed or withdrawn."),
        contribution_type: z.enum(["contribution", "withdrawal"]).describe("Whether this is a deposit into or a withdrawal from the saving plan."),
        from_account_id: z.string().optional().describe("Optional source account ID for a contribution."),
        to_account_id: z.string().optional().describe("Optional destination account ID for a withdrawal."),
        note: z.string().optional().describe("Optional note."),
      },
      async ({ saving_plan_id, amount, contribution_type, from_account_id, to_account_id, note }) => {
        const result = await addContribution({ saving_plan_id, amount, contribution_type, from_account_id, to_account_id, note })
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] }
      }
    )

    server.tool(
      "create_recipient",
      "Save a new transfer recipient (person or business) to the user's address book.",
      {
        displayName: z.string().describe("Full name of the recipient."),
        accountNumber: z.string().describe("Bank account number or identifier."),
        bankCode: z.string().optional().describe("Optional bank code (e.g. BIC/SWIFT)."),
        bankName: z.string().optional().describe("Optional bank name."),
        countryCode: z.string().optional().describe("Optional ISO country code, e.g. PH, US."),
        currency: z.string().optional().describe("Optional currency code for this recipient."),
      },
      async ({ displayName, accountNumber, bankCode, bankName, countryCode, currency }) => {
        const result = await createRecipient({ displayName, accountNumber, bankCode, bankName, countryCode, currency })
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] }
      }
    )

    server.tool(
      "register_merchant",
      "Register a new merchant so the user can record payments to it. Use list_merchant_categories to find the category ID first.",
      {
        name: z.string().describe("Name of the merchant, e.g. 'Spotify', 'Netflix', 'Jollibee'."),
        categoryId: z.string().describe("ID of the merchant category. Use list_merchant_categories to find it."),
      },
      async ({ name, categoryId }) => {
        const result = await registerMerchant(name, categoryId)
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] }
      }
    )
  },
  {},
  { basePath: "/api" }
)

export const GET = handler
export const POST = handler
export const DELETE = handler
