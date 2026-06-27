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

  const doubled = [...logos, ...logos];

  return (
    <section className="py-12 overflow-hidden">
      <div className="flex animate-[marquee_20s_linear_infinite] w-max gap-x-8">
        {doubled.map((logo, i) => (
          <div
            key={`${logo}-${i}`}
            className="text-sm font-medium text-foreground-muted whitespace-nowrap"
          >
            {logo}
          </div>
        ))}
      </div>
    </section>
  );
}
