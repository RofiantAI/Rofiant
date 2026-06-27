import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Zap, DollarSign, Database, ArrowUpRight } from "lucide-react";

export function ScaleSection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="info" dot className="mb-6">
              INFRASTRUCTURE
            </Badge>
            <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-5xl leading-tight">
              Start small, scale to{" "}
              <span className="bg-accent-primary/30 text-foreground px-1">
                production traffic.
              </span>
            </h2>
          </div>
          <div className="flex flex-col justify-end">
            <p className="text-lg text-foreground-secondary leading-relaxed max-w-md">
              Whether you are running a 10-person pilot or deploying to
              thousands of users, Rofiant scales automatically with no
              infrastructure to manage.
            </p>
            <div className="mt-6">
              <a href="/resources/documentation">
                <Button variant="primary" size="md">
                  Read the docs
                </Button>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Globe,
              title: "Multi-region",
              desc: "Deploy across multiple regions for low latency and high availability.",
              color: "text-blue-400",
            },
            {
              icon: Zap,
              title: "Auto-scaling",
              desc: "Capacity follows demand. No knobs to babysit and no manual ops.",
              color: "text-yellow-400",
            },
            {
              icon: DollarSign,
              title: "Predictable pricing",
              desc: "Start free, then scale up when you are ready. Keep billing predictable as you grow.",
              color: "text-green-400",
            },
            {
              icon: Database,
              title: "Data sovereignty",
              desc: "Full control over where your data lives. Choose your US or EU cloud region.",
              color: "text-purple-400",
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-6  border border-border hover:border-border-light hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
