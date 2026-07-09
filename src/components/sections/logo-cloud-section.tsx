export function LogoCloudSection() {
  const logos = [
    "Fireworks AI",
    "Cal.com",
    "Mintlify",
    "Symbolica",
    "BlindPay",
    "Magic Patterns",
    "Plain",
  ];

  return (
    <section className="py-12 border-t border-border">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((logo) => (
            <div
              key={logo}
              className="text-sm font-medium text-foreground-muted"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
