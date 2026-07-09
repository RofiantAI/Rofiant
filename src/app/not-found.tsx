import { NextIntlClientProvider } from "next-intl";
import { ErrorState } from "@/components/error-console";
import { HeaderSection } from "@/components/sections/header-section";
import { FooterSection } from "@/components/sections/footer-section";

export default function NotFound() {
  return (
    <NextIntlClientProvider>
      <HeaderSection />
      <ErrorState
        code="404"
        title="Page not found"
        subtitle="The page you're looking for doesn't exist or has moved."
        actions={
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center bg-button-primary px-6 text-sm font-medium text-button-primary-foreground hover:bg-foreground/90"
          >
            Back home
          </a>
        }
      />
      <FooterSection />
    </NextIntlClientProvider>
  );
}
