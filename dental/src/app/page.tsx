import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import ProblemSection from "@/components/ProblemSection";
import RevenueImpact from "@/components/RevenueImpact";
import HighValuePatients from "@/components/HighValuePatients";
import OutboundBooking from "@/components/OutboundBooking";
import InboundCalls from "@/components/InboundCalls";
import MultilingualVoice from "@/components/MultilingualVoice";
import HowItWorks from "@/components/HowItWorks";
import UseCases from "@/components/UseCases";
import HumanHandoff from "@/components/HumanHandoff";
import TrustSection from "@/components/TrustSection";
import DashboardPreview from "@/components/DashboardPreview";
import ConversationPreview from "@/components/ConversationPreview";
import CTASection from "@/components/CTASection";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function DentalPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <ProblemSection />
        <RevenueImpact />
        <HighValuePatients />
        <OutboundBooking />
        <InboundCalls />
        <MultilingualVoice />
        <HowItWorks />
        <UseCases />
        <HumanHandoff />
        <TrustSection />
        <DashboardPreview />
        <ConversationPreview />
        <CTASection />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
