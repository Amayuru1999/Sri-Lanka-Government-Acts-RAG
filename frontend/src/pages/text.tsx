// import React from "react";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Card, CardContent } from "@/components/ui/card";
// import { Mic, Send, Sparkles } from "lucide-react";
// import { motion } from "framer-motion";
// import { Button } from "@/components/ui/Button";
// import { Input } from "@/components/ui/Input";
// import { Card, CardContent } from "@/components/ui/Card";

// /**
//  * GOVDocLex – Dashboard layout
//  * ---------------------------------------------------------
//  * This component recreates the UI shown in the reference screenshot.
//  * TailwindCSS + shadcn/ui components are used for styling.
//  * ---------------------------------------------------------
//  * Sections
//  * 1. Top navigation bar
//  * 2. Greeting / headline
//  * 3. Message input with actions
//  * 4. Quick‑action cards grid
//  * 5. Right sidebar: notes list for Today + Previous 7 days
//  * 6. Subtle animated background (grid + particles)
//  */

// export default function GovDocLexDashboard() {
//   const quickActions = [
//     {
//       label: "Smart Search",
//       sub: "Find notes instantly",
//     },
//     {
//       label: "Browse Notes",
//       sub: "Explore subject‑specific notes",
//     },
//     {
//       label: "Organized Categories",
//       sub: "Navigate by folder",
//     },
//     {
//       label: "Trending Notes",
//       sub: "See popular materials",
//     },
//     {
//       label: "Save & Bookmark",
//       sub: "Quick access later",
//     },
//   ];

//   const today = ["AI in Everyday Life?", "Social Media Growth Hacks"];
//   const previous = [
//     "YouTube Monetization Tips",
//     "Python Programming Basics",
//     "Digital Marketing Essentials",
//     "Content Creation Secrets",
//     "Online Business Ideas",
//   ];

//   return (
//     <div className="relative max-w-[1920px] mx-auto min-h-screen bg-gradient-to-b from-[#001015] via-[#001519] to-[#001920] text-white overflow-hidden font-[Poppins]">
//       {/* Subtle moving particles */}
//       <motion.div
//         className="pointer-events-none absolute inset-0"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 0.4, y: [0, -20, 0] }}
//         transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
//       >
//         <SparklesPattern />
//       </motion.div>

//       {/* NAVBAR */}
//       {/* <nav className="relative z-10 flex items-center justify-between px-8 py-6">
//         <div className="flex items-center gap-2">
//           <img src="/logo.svg" alt="logo" className="w-8" />
//           <span className="text-xl font-semibold tracking-wide">GovDocLex</span>
//         </div>

//         <ul className="hidden md:flex items-center gap-10 text-sm tracking-wide opacity-80">
//           {["Home", "About", "Features", "Explore", "Team"].map((item) => (
//             <li
//               key={item}
//               className="hover:opacity-100 transition-opacity cursor-pointer"
//             >
//               {item}
//             </li>
//           ))}
//         </ul>

//         <Button
//           size="sm"
//           className="bg-[#00C3FF] hover:bg-[#31cdfc] shadow-xl text-sm"
//         >
//           Get Started Today
//         </Button>
//       </nav> */}

//       {/* MAIN GRID */}
//       <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 px-8 lg:px-16 xl:px-24 pt-8 lg:pt-16">
//         {/* LEFT – greeting, input, quick actions */}
//         <section>
//           <header className="mb-10">
//             <h1 className="text-4xl lg:text-5xl font-bold mb-2 leading-tight">
//               Hey, <span className="text-[#2EF2B8]">Anne</span>
//             </h1>
//             <p className="text-xl lg:text-2xl font-medium opacity-80">
//               How Can I Assist You Today?
//             </p>
//           </header>

//           {/* Message box */}
//           <div className="flex items-center w-full bg-[#0D1520] bg-opacity-70 border border-[#34495E]/40 rounded-full pl-4 pr-2 py-3 backdrop-blur-md">
//             <Sparkles className="opacity-60" size={20} />
//             <Input
//               placeholder="Message with…"
//               className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:opacity-40 text-sm"
//             />
//             <div className="flex items-center gap-2">
//               <Mic
//                 className="cursor-pointer opacity-70 hover:opacity-100"
//                 size={20}
//               />
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="hover:bg-transparent"
//               >
//                 <Send size={20} />
//               </Button>
//             </div>
//           </div>

//           {/* Quick actions */}
//           <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
//             {quickActions.map((qa) => (
//               <Card
//                 key={qa.label}
//                 className="bg-[#0D1520]/80 border-[#34495E]/40 text-left hover:ring-1 hover:ring-[#2EF2B8]/50 transition-all"
//               >
//                 <CardContent className="p-4">
//                   <h3 className="text-sm font-semibold mb-1">{qa.label}</h3>
//                   <p className="text-xs opacity-60 leading-snug">{qa.sub}</p>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </section>

//         {/* RIGHT SIDEBAR */}
//         <aside className="hidden lg:block border-l border-[#34495E]/40 pl-8">
//           <h2 className="text-lg font-semibold mb-6">GOVDocLex</h2>

//           {/* today */}
//           <DropdownSection title="Today" items={today} />

//           {/* previous 7 days */}
//           <DropdownSection title="Previous 7 Days" items={previous} />
//         </aside>
//       </div>
//     </div>
//   );
// }

// /* Helper components -------------------------------------------------- */

// function DropdownSection({ title, items }: { title: string; items: string[] }) {
//   const [open, setOpen] = React.useState(true);
//   return (
//     <div className="mb-8">
//       <button
//         onClick={() => setOpen(!open)}
//         className="flex items-center justify-between w-full text-left mb-2 font-medium"
//       >
//         <span>{title}</span>
//         <svg
//           className={`w-4 h-4 transition-transform ${
//             open ? "rotate-0" : "rotate-180"
//           }`}
//           xmlns="http://www.w3.org/2000/svg"
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M19 9l-7 7-7-7"
//           />
//         </svg>
//       </button>

//       {open && (
//         <ul className="space-y-2 text-sm">
//           {items.map((item) => (
//             <li
//               key={item}
//               className="px-3 py-2 hover:bg-[#1B2A36] rounded cursor-pointer flex items-center justify-between"
//             >
//               {item}
//               {title === "Today" && item === "Social Media Growth Hacks" && (
//                 <MoreDots />
//               )}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

// function MoreDots() {
//   return (
//     <svg
//       width={20}
//       height={4}
//       viewBox="0 0 20 4"
//       fill="currentColor"
//       className="opacity-60"
//     >
//       <circle cx="2" cy="2" r="2" />
//       <circle cx="10" cy="2" r="2" />
//       <circle cx="18" cy="2" r="2" />
//     </svg>
//   );
// }

// function SparklesPattern() {
//   // grid pattern + sparkles – simplified
//   return (
//     <div className="w-full h-full bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:40px_40px]" />
//   );
// }
