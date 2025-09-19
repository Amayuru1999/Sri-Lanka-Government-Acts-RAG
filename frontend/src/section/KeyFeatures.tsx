import React from "react";
import KeyFeaturesCard from "../components/Cards/KeyFeaturesCard";
import iconimg from "../assets/images/icon.png";
import greenback from "../assets/images/greenback.png"; // Adjust the path as necessary

const KeyFeaturesSection: React.FC = () => {
  return (
    <section
      className="py-10  flex flex-col justify-center items-center bg-[#0b1016]  relative "
      // style={{
      //   background: 'radial-gradient(circle, black 0%, #065f46 50%, black 100%)',
      // }}
    >
      <div className="max-w-[1920px] mx-auto px-4  ">
        <button className="bg-[#1AD3FF1A] text-[#1AD3FF] text-lg font-medium px-4 py-1.5 rounded-full">
          Key Features
        </button>
        <h2 className="text-4xl md:text-6xl font-semibold  text-white mb-6 ">
          Beyond Extraction: Smart Analysis for Legal Documents
        </h2>

        <img
          src={greenback}
          alt="greenball"
          className="hidden sm:block absolute z-0 w-[400px] lg:w-[600px] xl:w-[1800px] 
             left-1/2 top-[58%] transform -translate-x-1/2 -translate-y-1/2 opacity-70"
        />

        <div className="  items-center  flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2  gap-10 p-4  ">
            <KeyFeaturesCard
              title="Automated Document Extraction"
              description="Precisely extracts structured data from unstructured government documents"
              icon={iconimg}
            />
            <KeyFeaturesCard
              title="AI-Powered Legal Reasoning"
              description="Uses advanced AI reasoning to interpret extracted legal content, drawing logical connections and insights to support informed decision-making"
              icon={iconimg}
            />
            <KeyFeaturesCard
              title="Sri Lanka-Optimized"
              description="Custom-trained on local government document structures"
              icon={iconimg}
            />
            <KeyFeaturesCard
              title="Interactive Knowledge Graph"
              description="Visualizes relationships between ministries, laws, and policies"
              icon={iconimg}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default KeyFeaturesSection;
