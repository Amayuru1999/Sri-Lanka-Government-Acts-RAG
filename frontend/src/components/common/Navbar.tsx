import { navItems } from "@/constants/navItems.constants";
import { SetStateAction, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoClose, IoMenu } from "react-icons/io5";
import Logo from "/assets/images/logo.webp";
import { BookTableBtn } from "./Button";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const currentPath = location.pathname.split("/")[1];
    setActiveNavItem(currentPath);
    setIsMenuOpen(false);
  }, [location]);

  const handleNav = () => {
    setIsMenuOpen(!isMenuOpen);
  };

 const handleNavClick = (id: SetStateAction<string>) => {
  setActiveNavItem(id);

  // const clickedItem = navItems.find((item) => item.id === id);

  // if (clickedItem?.path && clickedItem.path !== "#") {
  //   navigate(clickedItem.path);
  //   setIsMenuOpen(false);
  // } else {


    const section = document.getElementById(id as string);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  // }
};

  const handleLogoClick = () => {
    navigate("/");
    window.scrollTo(0, 0); // Scroll to top after navigation
  };

  return (
    <div
      className={`flex justify-center w-full items-center bg-[#0a1117] ${
        hasScrolled ? "backdrop-blur-lg shadow-md" : ""
      }`}
    >
      <div
        className={`flex items-center justify-between px-4 sm:px-8 md:px-8 py-3 w-full mx-auto max-w-[1920px] transition-all duration-300 z-30 relative`}
      >
        <div className="flex">
          <img
            src={Logo}
            alt="logo"
            className="cursor-pointer w-14 xl:w-1/2"
            onClick={handleLogoClick}
          />
        </div>
        <div className="hidden md:flex">
          {navItems.map((item) => (
            <ul
              key={item.id}
              className={`text-sm lg:text-base px-6 xl:px-10 py-2 cursor-pointer font-sfpro 
                  ${
                    activeNavItem === item.id
                      ? "border-white text-[#41B7FC]"
                      : "border-transparent text-white hover:text-[#41B7FC]"
                  }`}
              onClick={() => handleNavClick(item.id)}
            >
              {item.label}
            </ul>
          ))}
        </div>
        <div className="flex flex-row items-center space-x-2">
          <div>
            <div className="flex gap-2 text-white uppercase sm:gap-4">
              <div className="flex items-center justify-center rounded-sm sm:order-last">
                <BookTableBtn />
              </div>
              <div className="relative"></div>
            </div>
          </div>
          <div
            onClick={handleNav}
            className="block bg-[#41B7FC] cursor-pointer w-9 h-9 text-customYellow md:hidden z-50 border rounded-md"
          >
            {isMenuOpen ? (
              <IoClose className="text-black w-9 h-9" />
            ) : (
              <IoMenu className="z-50 px-1 text-black w-9 h-9" />
            )}
          </div>
        </div>
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#060A0B] md:hidden z-40 flex flex-col items-center p-2">
            {navItems.map((item) => (
              <ul
                key={item.id}
                className={`text-sm lg:text-base border-2 rounded-2xl px-8 lg:px-6 xl:px-8 py-2 cursor-pointer font-midsun 
                    ${
                      activeNavItem === item.id
                        ? "border-white text-[#41B7FC]"
                        : "border-transparent text-white hover:text-[#41B7FC]"
                    }`}
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </ul>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;
