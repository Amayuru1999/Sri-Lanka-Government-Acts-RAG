import { useEffect } from "react";
import gsap from "gsap";
import CommonLabel from "@/components/common/Label";
import Court from "../../assets/images/rotatingimg.png";

function Hero() {
  useEffect(() => {
    gsap.to("#rotating-element", {
      rotateY: 360, 
      duration: 4,
      ease: "power1.inOut",
      repeat: -1, 
    });
  }, []);

  return (
    <div className="flex max-w-[1920px] mx-auto">
      <div className="flex flex-col justify-center gap-3 lg:gap-4 lg:w-3/4">
        <CommonLabel text={"Welcome to GovDocLex"} />
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFFFF] to-[#FFFFFF]/50 font-sfpro text-4xl md:text-6xl ">
          AI-Powered Extraction & Reasoning for Sri Lankan Government Documents
        </h1>
        <p className="text-white/80 font-sfpro text-sm lg:text-xl">
          Transform unstructured Gazettes, Acts, and Bills into searchable,
          explainable, and actionable knowledge.
        </p>
      </div>
      <div className="hidden sm:block">
        <div
          className="w-64 h-64  rounded-lg  mx-auto my-8
                 flex items-center justify-center
                 [transform-style:preserve-3d] [perspective:800px]"
          id="rotating-element"
        >
          <img src={Court} alt="court" className="w-[360px]" />
        </div>
      </div>
    </div>
  );
}

export default Hero;
