import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Services from "@/components/home/Services";
import HowItWorks from "@/components/home/HowItWorks";
import Gallery from "@/components/home/Gallery";
import Pricing from "@/components/home/Pricing";
import Testimonials from "@/components/home/Testimonials";
import FinalCta from "@/components/home/FinalCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Services />
      <HowItWorks />
      <Gallery />
      <Pricing />
      <Testimonials />
      <FinalCta />
    </>
  );
}
