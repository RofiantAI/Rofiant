import { PageLayout } from "@/components/page-layout";

export default function TermsOfServicePage() {
  return (
    <PageLayout title="Terms of Service" subtitle="Last updated: January 2026">
      <div className="prose prose-invert max-w-none space-y-6 text-foreground-secondary text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-foreground">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using the Rofiant platform and services, you agree to
          be bound by these Terms of Service. If you are using the services on
          behalf of an organization, you represent that you have authority to
          bind that organization.
        </p>

        <h2 className="text-lg font-semibold text-foreground">2. Services</h2>
        <p>
          Rofiant provides AI-powered platform services including chat, voice,
          document intelligence, and workflow assistant capabilities. We reserve
          the right to modify, suspend, or discontinue any part of the services
          with reasonable notice.
        </p>

        <h2 className="text-lg font-semibold text-foreground">3. Data Usage</h2>
        <p>
          Your data is processed according to our Privacy Policy. We do not use
          customer data to train our models unless explicitly authorized.
          Customer data remains the property of the customer at all times.
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          4. Acceptable Use
        </h2>
        <p>
          You agree not to use the services for any unlawful purpose, to attempt
          to gain unauthorized access to any systems, or to interfere with the
          integrity or performance of the services.
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          5. Limitation of Liability
        </h2>
        <p>
          To the maximum extent permitted by law, Rofiant shall not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages arising from your use of the services.
        </p>

        <h2 className="text-lg font-semibold text-foreground">6. Contact</h2>
        <p>Questions about these terms? Contact us at legal@rofiant.ca.</p>
      </div>
    </PageLayout>
  );
}
