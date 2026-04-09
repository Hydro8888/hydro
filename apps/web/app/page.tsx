import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import { SocialProofBar } from '@/components/landing/social-proof-bar';
import { FeaturesSection } from '@/components/landing/features-section';
import { ModelShowcase } from '@/components/landing/model-showcase';
import { HowItWorks } from '@/components/landing/how-it-works';
import { PricingPreview } from '@/components/landing/pricing-preview';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { FinalCta } from '@/components/landing/final-cta';
import { LandingFooter } from '@/components/landing/landing-footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <LandingHeader />
      <main>
        <HeroSection />
        <SocialProofBar />
        <FeaturesSection />
        <ModelShowcase />
        <HowItWorks />
        <PricingPreview />
        <TestimonialsSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
