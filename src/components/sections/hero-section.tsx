import { Button } from "@/components/ui/button";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[85vh] flex items-end">
      <div className="absolute inset-0">
        <Image
          src="/hero.png"
          alt="Hero background"
          fill
          className="object-cover scale-105"
          priority
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-0.5 pb-8 sm:pb-12 w-full flex items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl font-normal tracking-tight text-foreground sm:text-7xl lg:text-[5.5rem] leading-[1.1]">
            AI for missions
            <br />
            that{" "}
            <span className="bg-accent-primary px-2 text-background">
              matter.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground-secondary">
            Rofiant delivers secure, compliant AI for government agencies and
            enterprises. From conversational agents to mission-critical analysis
            — built for the work that counts.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <a href="/auth/signup">
            <Button size="lg">Start for free</Button>
          </a>
          <a href="/company/contact">
            <Button variant="outline" size="lg">
              Talk to sales
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
