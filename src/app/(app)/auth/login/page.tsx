import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";

export default function LoginPage() {
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
            <img src={"/logo-light.svg"} className="h-6 w-auto" />
          </div>
          <div>
            <blockquote className="text-lg text-foreground-secondary leading-relaxed max-w-md">
              AI built for the work that matters. Secure, compliant, and ready
              for government agencies and enterprises worldwide.
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-background-tertiary flex items-center justify-center">
                <img src={"/icon.svg"} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Rofiant Team
                </p>
                <p className="text-xs text-foreground-muted">Engineering</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <span className="text-foreground font-semibold text-xl tracking-tight">
              Rofiant
            </span>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
