import HeroSection from '@/components/homepage/HeroSection';
import DataTicker from '@/components/homepage/DataTicker';
import EstrogenCliff from '@/components/homepage/EstrogenCliff';
import BodyMap from '@/components/homepage/BodyMap';
import MythBuster from '@/components/homepage/MythBuster';
import RootCauseParallax from '@/components/homepage/RootCauseParallax';
import LifestyleSlider from '@/components/homepage/LifestyleSlider';
import CommunityPoll from '@/components/homepage/CommunityPoll';
import ScienceExplainer from '@/components/homepage/ScienceExplainer';
import VoicesCarousel from '@/components/homepage/VoicesCarousel';
import BreathingExercise from '@/components/homepage/BreathingExercise';
import EditorialFooter from '@/components/homepage/EditorialFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Data Ticker */}
      <DataTicker />

      {/* 3. Estrogen Cliff */}
      <EstrogenCliff />

      {/* 4. Interactive Body Map */}
      <BodyMap />

      {/* 5. Myth Buster */}
      <MythBuster />

      {/* 6. Root Cause Parallax */}
      <RootCauseParallax />

      {/* 7. Lifestyle Slider */}
      <LifestyleSlider />

      {/* 8. Community Poll */}
      <CommunityPoll />

      {/* 9. Science Explainer */}
      <ScienceExplainer />

      {/* 10. Voices of Change */}
      <VoicesCarousel />

      {/* 11. Breathing Exercise */}
      <BreathingExercise />

      {/* 12. Editorial Footer */}
      <EditorialFooter />
    </div>
  );
}
