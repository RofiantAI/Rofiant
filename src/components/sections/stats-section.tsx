export function StatsSection() {
  const stats = [
    { value: "24/7", label: "Uptime monitoring" },
    { value: "SOC 2", label: "In progress" },
    { value: "24/7", label: "Enterprise support" },
    { value: "AES-256", label: "Encryption standard" },
  ];

  return (
    <section className="py-12 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-normal text-foreground">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-foreground-secondary">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
