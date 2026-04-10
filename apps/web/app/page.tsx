import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import { LogoCloud } from '@/components/landing/logo-cloud';
import { FeaturesSection } from '@/components/landing/features-section';
import { StatsBlock } from '@/components/landing/stats-block';
import { UseCases } from '@/components/landing/use-cases';
import { ModelShowcase } from '@/components/landing/model-showcase';
import { PricingPreview } from '@/components/landing/pricing-preview';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { FaqSection } from '@/components/landing/faq-section';
import { FinalCta } from '@/components/landing/final-cta';
import { LandingFooter } from '@/components/landing/landing-footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <LandingHeader />
      <main>
        <HeroSection />
        <LogoCloud />
        <FeaturesSection />
        <StatsBlock />
        <UseCases />
        <ModelShowcase />
        <TestimonialsSection />
        <PricingPreview />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
