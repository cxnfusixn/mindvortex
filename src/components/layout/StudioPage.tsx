"use client";
import { useCopy } from "@/i18n/LocaleProvider";
import { Navigation } from "@/components/navigation/Navigation";
import { CinematicIntro } from "@/components/motion/CinematicIntro";
import { MotionSystem } from "@/components/motion/MotionSystem";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { NoiseOverlay } from "@/components/layout/NoiseOverlay";
import { HeroScene } from "@/components/sections/HeroScene";
import { ManifestoScene } from "@/components/sections/ManifestoScene";
import { CapabilitiesScene } from "@/components/sections/CapabilitiesScene";
import { ExperienceScene } from "@/components/sections/ExperienceScene";
import { ProjectsScene } from "@/components/sections/ProjectsScene";
import { StackScene } from "@/components/sections/StackScene";
import { PhilosophyScene } from "@/components/sections/PhilosophyScene";
import { ContactScene } from "@/components/sections/ContactScene";
export default function Home() {
  const { copy } = useCopy();
  return (
    <>
      <a href="#main" className="skip-link">
        {copy.skip}
      </a>
      <Navigation />
      <CinematicIntro />
      <main id="main">
        <HeroScene />
        <ManifestoScene />
        <CapabilitiesScene />
        <ExperienceScene />
        <ProjectsScene />
        <StackScene />
        <PhilosophyScene />
        <ContactScene />
      </main>
      <NoiseOverlay />
      <CustomCursor />
      <MotionSystem />
    </>
  );
}
