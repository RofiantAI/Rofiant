import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function SignupPage() {
  const t = await getTranslations("auth.signup");

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-background-secondary">
        <div className="absolute inset-0">
          <Image
            src="/hero.png"
            alt="Rofiant"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-background/80" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="text-foreground font-semibold text-xl tracking-tight">
            <img src={"/logo-light.svg"} alt="Rofiant" className="h-6 w-auto" />
          </div>
          <div>
            <blockquote className="text-lg text-foreground-secondary leading-relaxed max-w-md">
              {t("quote")}
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <span className="text-foreground font-semibold text-xl tracking-tight">
              {t("logoText")}
            </span>
          </div>
          <Suspense fallback={null}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
