import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";

export default function FedRAMPPage() {
  const controls = [
    { family: "Access Control", status: "In Progress", count: 25 },
    { family: "Audit and Accountability", status: "In Progress", count: 16 },
    { family: "Configuration Management", status: "In Progress", count: 11 },
    {
      family: "Identification and Authentication",
      status: "In Progress",
      count: 11,
    },
    {
      family: "System and Communications Protection",
      status: "In Progress",
      count: 17,
    },
    {
      family: "System and Information Integrity",
      status: "In Progress",
      count: 14,
    },
  ];

  return (
    <PageLayout
      badge="LEGAL"
      title="FedRAMP"
      subtitle="Rofiant's approach to FedRAMP compliance for federal cloud deployments."
    >
      <div className="space-y-8 text-foreground-secondary text-sm leading-relaxed">
        <p className="text-base">
          Rofiant is designed to support FedRAMP compliance requirements. Our
          platform implements the security controls necessary for federal cloud
          deployments and we work with agencies to support their authorization
          processes.
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          Security Control Families
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {controls.map((c) => (
            <Card
              key={c.family}
              variant="bordered"
              className="p-4 flex items-center justify-between"
            >
              <div>
                <span className="text-sm font-medium text-foreground">
                  {c.family}
                </span>
                <span className="ml-2 text-xs text-foreground-muted">
                  ({c.count} controls)
                </span>
              </div>
              <span className="text-xs text-accent-success">{c.status}</span>
            </Card>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-foreground">
          Deployment Options
        </h2>
        <p>
          Rofiant can be deployed in FedRAMP-authorized cloud environments (AWS
          GovCloud, Azure Government) or on-premises in agency-owned
          infrastructure. We provide the documentation and evidence packages
          needed to support your ATO process.
        </p>

        <h2 className="text-lg font-semibold text-foreground">Contact</h2>
        <p>
          For FedRAMP inquiries, contact our compliance team at
          compliance@rofiant.ca.
        </p>
      </div>
    </PageLayout>
  );
}
