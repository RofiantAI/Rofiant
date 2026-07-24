"use client";

import { Geist } from "next/font/google";
import Link from "next/link";
import "./(app)/globals.css";
import { ErrorState } from "@/components/error-console";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="w-full pt-4">
          <div className="mx-auto max-w-8xl px-2 sm:px-3 lg:px-4">
            <div className="flex h-12 items-center border border-border bg-foreground px-4 sm:px-6">
              <Link href="/" className="flex items-center">
                <img src="/logo.svg" alt="Rofiant" className="h-6 w-auto" />
              </Link>
            </div>
          </div>
        </header>
        <ErrorState
          code="500"
          title="Something went wrong"
          subtitle="An unexpected error occurred. Please try again."
          digest={error.digest}
          actions={
            <>
              <button
                onClick={() => unstable_retry()}
                className="inline-flex h-11 items-center justify-center bg-button-primary px-6 text-sm font-medium text-button-primary-foreground hover:bg-foreground/90"
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center border border-border px-6 text-sm font-medium transition-colors hover:bg-background-tertiary"
              >
                Back home
              </Link>
            </>
          }
        />
        <footer className="mt-auto w-full border-t border-border px-4 py-6 text-center text-xs text-foreground-muted sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Rofiant. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
