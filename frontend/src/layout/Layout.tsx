import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";
import { Outlet } from "react-router-dom";
import bgnav from "/assets/images/bg-nav.webp";
import shinball from "/assets/images/shiny_buttons.webp";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen relative z-50 ">
      <img src={bgnav} alt="bgnav" className="hidden sm:block absolute z-0 left-1/3 w-[268px]" />
      <img src={shinball} alt="shinball" className="hidden sm:block absolute z-0 left-1/3 w-[300px]" />
      <Navbar />
      <main className="flex-grow px-2 sm:px-4 md:px-6 xl:px-8 bg-[#0a1117]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
