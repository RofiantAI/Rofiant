const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Chat AI", href: "/platform/chat-ai" },
      { label: "Voice AI", href: "/platform/voice-ai" },
      {
        label: "Document Intelligence",
        href: "/platform/document-intelligence",
      },
      { label: "Agents", href: "/platform/agents" },
      { label: "API", href: "/platform/api" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Federal Agencies", href: "/solutions/federal-agencies" },
      {
        label: "Defense & Intelligence",
        href: "/solutions/defense-intelligence",
      },
      { label: "Law Enforcement", href: "/solutions/law-enforcement" },
      { label: "Enterprise", href: "/solutions/enterprise" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/resources/documentation" },
      { label: "API Reference", href: "/resources/api-reference" },
      { label: "Compliance Guides", href: "/resources/compliance-guides" },
      { label: "Changelog", href: "/resources/changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/company/about" },
      { label: "Careers", href: "/company/careers" },
      { label: "Security", href: "/company/security" },
      { label: "Contact", href: "/company/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms-of-service" },
      { label: "Privacy Policy", href: "/legal/privacy-policy" },
      { label: "FedRAMP", href: "/legal/fedramp" },
      { label: "ITAR Policy", href: "/legal/itar-policy" },
    ],
  },
];

export function FooterSection() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-6">
          <div className="col-span-2">
            <a href="/" className="inline-flex items-center gap-2">
              <span className="text-xl font-normal text-foreground">
                <img src={"/logo-light.svg"} className="h-6 w-auto" />
              </span>
            </a>
            <p className="mt-4 text-sm text-foreground-secondary">
              AI for missions that matter.
            </p>
            <p className="mt-2 text-sm text-foreground-muted">
              © 2026 Rofiant Inc. All rights reserved.
            </p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
