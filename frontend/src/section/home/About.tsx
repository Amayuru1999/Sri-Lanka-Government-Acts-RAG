import CommonLabel from "@/components/common/Label";
import greenball from "/assets/images/green_ball.png";

function About() {
  return (
    <div className="py-4 xsm:p-6 sm:p-12 md:p-20 xl:p-24 relative max-w-[1920px] mx-auto">
      <img
        src={greenball}
        alt="greenball"
        className="hidden sm:block absolute z-0 bottom-20 xl:bottom-0 left-1/4 w-[400px] lg:w-[600px] xl:w-[800px]"
      />
      <div className="p-4 sm:p-6 md:p-10 xl:p-12 border bg-[#0E2324]/20 rounded-3xl text-center flex flex-col items-center gap-2 sm:gap-4">
        <CommonLabel text={"What is GovDocLex"} />
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFFFF] to-[#FFFFFF]/50 font-sfpro text-xl sm:text-2xl md:text-3xl lg:text-4xl">
          Built for Innovators, Loved by Everyone
        </h1>
        <p className="text-white/80 font-sfpro text-xs sm:text-sm md:text-base">
          GovDocLex is an AI-powered platform designed to extract, analyze, and
          explain complex information from Sri Lankan government documents—such
          as Gazettes, Acts, Bills, and Circulars—transforming them into
          structured, interconnected knowledge.
        </p>
      </div>
    </div>
  );
}

export default About;
