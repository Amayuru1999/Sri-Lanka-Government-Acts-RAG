import About from "@/section/home/About";
import Hero from "@/section/home/Home";

import KeyFeatures from "@/section/KeyFeatures";
import TrackEverything from "@/section/TrackEverything";
import GovDocLexFeatures from "@/section/SmartExtraction";
import Team from "@/section/home/Team";
import Chatbotbox from "@/components/chatbotbox";

const Home = () => {
  return (
    <div className=" relative">
      <Hero />
      
      <section id="about">
        <About />
      </section>

      <section id="features">
        <KeyFeatures />
      </section>

      <GovDocLexFeatures />

      <section id="explore">
        <TrackEverything />
     
      </section>

      <section id="team" className="hidden md:block">
        <Team />
      </section>

      <div className="absolute">

        <Chatbotbox/>




      </div>


    </div>
  );
};

export default Home;
