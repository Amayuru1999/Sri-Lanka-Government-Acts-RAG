import React from "react";
import footerback from "../../assets/images/footerback.png";

const FooterSection: React.FC = () => {
  return (
    <footer className="bg-[#0a1117] text-white py-16 px-4  relative  ">
      <div className="max-w-[1920px] mx-auto flex flex-col  md:justify-center   ">

        <div className="flex-1 flex justify-center  ">
          <div className="flex gap-20">
            <div className="flex flex-col gap-2 text-center">
              <a href="#home" className="hover:underline">
                Home
              </a>
              <a href="#about" className="hover:underline">
                About
              </a>
              <a href="#features" className="hover:underline">
                Features
              </a>
            </div>
            <div className="flex flex-col gap-2 text-center">
              <a href="#explore" className="hover:underline">
                Explore
              </a>
              <a href="#team" className="hover:underline">
                Team
              </a>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row sm:justify-between items-center mt-6 md:mt-0  md:text-lg ">
          
          <div className="md:w-full text-left mb-0 md:mb-0 text-sm ">
            Copyright {new Date().getFullYear()} |{" "}
            <a href="#" className="text-[#41B7FC] hover:underline">
              GocDoccLex
            </a>{" "}
            | All Rights Reserved
          </div>

          <div className="md:w-1/3 flex flex-col sm:flex-row md:justify-end justify-center items-center gap-6 text-sm mb-0 md:mt-0 mt-5 sm:mt-0">
            <a href="#" className="hover:underline">
              Terms & Conditions
            </a>
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
          </div>


        </div>

        <img
          src={footerback}
          alt="greenball"
          className="hidden sm:block absolute z-0 w-[400px] lg:w-[600px] xl:w-[1800px] 
             left-1/2 bottom-0 transform -translate-x-1/2    "
        />
      </div>
    </footer>
  );
};

export default FooterSection;
