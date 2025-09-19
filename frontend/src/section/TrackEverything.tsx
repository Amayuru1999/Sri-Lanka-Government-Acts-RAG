import { FaCheckCircle } from "react-icons/fa";
import whytheseimg from "../assets/images/whytheses.png";
import squareback from "../assets/images/squareback.png";

const FeatureHighlightSection = () => {
  return (
    <section className="bg-[#0B0F14] py-16 px-4 text-white flex flex-col justify-center items-center relative">
      <div className=" mx-auto grid md:grid-cols-2 gap-10 items-center ">
        {/* Left Content */}
        <div className="space-y-6  ">
          <button className="bg-[#1AD3FF1A] text-[#1AD3FF] text-lg font-medium px-4 py-1.5 rounded-full">
            Why These Matter
          </button>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Track Everything, Anytime,
            <br />
            Anywhere
          </h2>
          <ul className="space-y-3 text-[#B3B8C5] text-lg">
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-[#1AD3FF]" />
              Faster legal research
            </li>
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-[#1AD3FF]" />
              Error-proof compliance tracking
            </li>
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-[#1AD3FF]" />
              Transparent decision-making with AI explanations
            </li>
            <li className="flex items-center gap-2">
              <FaCheckCircle className="text-[#1AD3FF]" />
              Future-ready system that scales with new document types
            </li>
          </ul>
          <button className="mt-6 bg-[#1AD3FF] hover:bg-[#0fcce6] text-[#0B0F14] font-bold px-6 py-2.5 rounded-full transition duration-300">
            Explore GovDocxLen
          </button>
        </div>
        <img
          src={squareback}
          alt="squareback"
          className="hidden sm:block absolute z-0 w-[400px] lg:w-[600px] xl:w-[1800px] 
             left-1/2 top-[72%] transform -translate-x-1/2 -translate-y-1/2 "
        />

        {/* Right Image/Graphic */}
        <div className="flex justify-center">
          <img
            src={whytheseimg}
            alt="Feature Illustration"
            className="rounded-2xl w-full "
          />
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlightSection;
