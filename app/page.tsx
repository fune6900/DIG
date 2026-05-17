import { HeroSection } from "@/app/(public)/_components/landing/HeroSection";
import { ConceptSection } from "@/app/(public)/_components/landing/ConceptSection";
import { FeaturesSection } from "@/app/(public)/_components/landing/FeaturesSection";
import { ShowcaseSection } from "@/app/(public)/_components/landing/ShowcaseSection";
import { CtaSection } from "@/app/(public)/_components/landing/CtaSection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ConceptSection />
      <FeaturesSection />
      <ShowcaseSection />
      <CtaSection />
    </main>
  );
}
