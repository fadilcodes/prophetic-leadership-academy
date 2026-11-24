import { HeroSection } from "@/components/home/HeroSection";
import { HomeBottomSections } from "@/components/home/HomeBottomSections";
import { ServicePillarsSection } from "@/components/home/ServicePillarsSection";
import { UpcomingProgramsSection } from "@/components/home/UpcomingProgramsSection";

export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicePillarsSection />
      <UpcomingProgramsSection />
      <HomeBottomSections />
    </>
  );
}
