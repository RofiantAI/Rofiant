export function BrandLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <>
      <img src="/logo-light.svg" alt="Rofiant" className={`${className} hidden dark:block`} />
      <img src="/logo.svg" alt="Rofiant" className={`${className} hidden light:block`} />
    </>
  );
}
