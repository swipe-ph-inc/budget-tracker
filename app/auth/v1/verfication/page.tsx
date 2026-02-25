import Link from "next/link";
import { MailCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
    searchParams: {
        status?: string
    }
}

export default function VerificationPage({ searchParams }: Props) {
    const status = searchParams.status ?? "success";
    const isSuccess = status === "success";

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    {isSuccess ? (
                        <MailCheck className="h-7 w-7 text-primary" aria-hidden />
                    ) : (
                        <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden />
                    )}
                </div>

                <h1 className="mt-6 text-2xl font-bold text-foreground">
                    {isSuccess ? "Email verified" : "Verification link invalid or expired"}
                </h1>

                <p className="mt-3 text-sm text-muted-foreground">
                    {isSuccess
                        ? "Your email has been successfully verified. You can now log in to your account."
                        : "The verification link is invalid or has already been used. Please request a new verification email or try logging in."}
                </p>

                <div className="mt-8 flex flex-col gap-3">
                    <Link href="/login">
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                            Go to Login
                        </Button>
                    </Link>

                    {!isSuccess && (
                        <p className="text-xs text-muted-foreground">
                            If you continue to have issues, please double‑check that you used the latest
                            email we sent or contact support.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}