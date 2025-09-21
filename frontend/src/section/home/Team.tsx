import CommonLabel from "@/components/common/Label";
import greenball from "/assets/images/green_ball.png";
import TeamBox from "@/components/team/TeamBox";
import { TryNowBtn } from "@/components/common/Button";

function Team() {
  return (
    <div className="py-4 xsm:p-6 sm:p-12 md:p-20 xl:p-24 relative max-w-[1920px] mx-auto">
      <div className="flex justify-center">
        <CommonLabel text={"Team"} />
      </div>
      <img
        src={greenball}
        alt="greenball"
        className="hidden sm:block absolute z-0 bottom-20 xl:bottom-0 left-1/4 w-[400px] lg:w-[600px] xl:w-[800px]"
      />
      <div className="p-4 sm:p-6 bg-[#0E2324]/20 rounded-3xl text-center flex flex-col items-center gap-2">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFFFF] to-[#FFFFFF]/50 font-sfpro text-xl sm:text-2xl md:text-3xl lg:text-4xl">
          The Minds Behind GovDocLex
        </h1>
        <p className="text-white/80 font-sfpro text-xs sm:text-sm md:text-base">
          A multidisciplinary team from the University of Ruhuna, combining AI
          expertise with legal domain knowledge
        </p>
      </div>
      <div className="flex justify-center">
        <TeamBox />
      </div>
      <div className="justify-center flex">
        <TryNowBtn />
      </div>
    </div>
  );
}

export default Team;
