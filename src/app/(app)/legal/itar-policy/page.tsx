import { PageLayout } from "@/components/page-layout";

export default function ITARPolicyPage() {
  return (
    <PageLayout
      badge="LEGAL"
      title="ITAR Policy"
      subtitle="Rofiant's approach to International Traffic in Arms Regulations compliance."
    >
      <div className="prose prose-invert max-w-none space-y-6 text-foreground-secondary text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-foreground">Overview</h2>
        <p>
          Rofiant understands the importance of ITAR compliance for
          organizations handling defense-related technical data. Our platform is
          designed with controls to support ITAR-regulated workflows.
        </p>

        <h2 className="text-lg font-semibold text-foreground">Data Controls</h2>
        <p>
          Rofiant supports data residency within the United States. All customer
          data can be restricted to US-based infrastructure. Access controls can
          be configured to limit system access to US persons only.
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          Access Restrictions
        </h2>
        <p>
          Our platform supports granular access controls that can restrict data
          access based on citizenship status, security clearance, and
          organizational role. All access attempts are logged immutably for
          audit purposes.
        </p>

        <h2 className="text-lg font-semibold text-foreground">Contact</h2>
        <p>
          For ITAR-related questions, contact our compliance team at
          compliance@rofiant.ca.
        </p>
      </div>
    </PageLayout>
  );
}
