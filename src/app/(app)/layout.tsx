import { HeaderSection } from "@/components/sections/header-section";
import { FooterSection } from "@/components/sections/footer-section";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderSection />
      {children}
      <FooterSection />
    </>
  );
}
