import Header from "@/components/layout/landing/Header";
import Footer from "@/components/layout/landing/Footer";
import WhatsAppButton from "@/components/layout/landing/WhatsAppButton";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import PricingSection from "@/components/landing/PricingSection";
import ShowcaseSection from "@/components/landing/ShowcaseSection";
import CTASection from "@/components/landing/CTASection";
import VideoSection from "@/components/landing/VideoSection";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <BenefitsSection />
        <CategoriesSection />
        <PricingSection />
        <ShowcaseSection />
        <VideoSection />
        <CTASection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default LandingPage;
