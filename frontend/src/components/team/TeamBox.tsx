import { teamData } from "@/constants/teamData.constants";
import TeamCard from "./TeamCard";
import box from "/assets/images/blue_box.webp";

const cardPositions = [
  { top: "0%", left: "-30%" },
  { top: "35%", left: "-30%" },
  { top: "70%", left: "-30%" },
  { top: "0%", left: "90%" },
  { top: "35%", left: "90%" },
  { top: "70%", left: "90%" },
];

const profilePositions = [
  { top: "0%", left: "15%" },
  { top: "35%", left: "15%" },
  { top: "70%", left: "15%" },
  { top: "0%", left: "60%" },
  { top: "35%", left: "60%" },
  { top: "70%", left: "60%" },
];

function TeamBox() {
  return (
    <div className="relative py-6 flex items-center justify-center">
      {/* Background Image */}
      <img src={box} alt="box" className="sm:w-[350px] md:w-[400px] lg:w-[500px]" />

      {/* Dynamically Render Cards with data */}
      {cardPositions.map((pos, index) => {
        const member = teamData[index];
        if (!member) return null;

        return (
          <div
            key={index}
            className="absolute"
            style={{ top: pos.top, left: pos.left }}
          >
            <TeamCard name={member.name} description={member.description} />
          </div>
        );
      })}

      {/* profiles */}
      {profilePositions.map((pos, index) => {
        const member = teamData[index];
        if (!member) return null;

        return (
          <img
            key={`profile-${index}`}
            src={member.profileImage}
            alt={`${member.name}-profile`}
            className="hidden sm:block absolute w-20 lg:w-28 h-20 lg:h-28 object-cover rounded-full border-2 border-white z-40"
            style={{ top: pos.top, left: pos.left }}
          />
        );
      })}
    </div>
  );
}

export default TeamBox;
