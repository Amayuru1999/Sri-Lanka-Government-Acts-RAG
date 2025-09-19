import React from "react";

interface KeyFeaturesCardProps {
  title: string;
  description: string;
  icon?: string | React.ReactNode;
}

const KeyFeaturesCard: React.FC<KeyFeaturesCardProps> = ({
  title,
  description,
  icon,
}) => {
  return (
    <div className="bg-[#101820]  rounded-xl p-4 shadow-md text-white w-full mx-auto py-10 min-h-52 items-start flex flex-col justify-center">
      <div className="flex items-center mb-2 space-x-2">
        {icon &&
          (typeof icon === "string" ? (
            <img src={icon} alt="icon" className="w-6 h-6" />
          ) : (
            <span className="text-white text-lg">{icon}</span>
          ))}
        <h3 className="text-2xl font-semibold">{title}</h3>
      </div>
      <p className="text-lg text-gray-400">{description}</p>
    </div>
  );
};

export default KeyFeaturesCard;
