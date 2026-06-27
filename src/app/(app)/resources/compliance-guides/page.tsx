import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";

export default function ComplianceGuidesPage() {
  const guides = [
    { title: "SOC 2 Type II", desc: "How Rofiant meets SOC 2 requirements. Audit reports, controls, and evidence." },
    { title: "Data Privacy", desc: "Data handling, retention, deletion, and GDPR/CCPA compliance." },
    { title: "Encryption", desc: "Encryption at rest and in transit. Key management and rotation." },
    { title: "Access Control", desc: "Role-based access, SSO integration, and authentication best practices." },
    { title: "Audit Logging", desc: "What we log, how long we retain, and how to export for your compliance needs." },
    { title: "Incident Response", desc: "Our incident response process, SLAs, and communication protocols." },
  ];

  return (
    <PageLayout
      badge="RESOURCES"
      title="Compliance Guides"
      subtitle="Detailed guides on how Rofiant meets security and compliance requirements."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {guides.map((g) => (
          <Card key={g.title} variant="bordered" className="p-6 hover:bg-card-hover transition-colors cursor-pointer">
            <h3 className="font-semibold text-foreground">{g.title}</h3>
            <p className="mt-2 text-sm text-foreground-secondary">{g.desc}</p>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}