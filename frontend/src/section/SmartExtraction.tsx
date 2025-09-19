// src/components/GovDocLexFeatures.jsx

import extractimg from "../assets/images/smartextraction.png"; 

const features = [
  {
    title: "Smart Extraction",
    description: (
      <>
        Uses LayoutLM and Mistral OCR to read scanned/textual documents while
        preserving their original layout (headings, tables).
        <br />
        Identifies key entities (ministries, laws, dates) via custom BERT
        models.
      </>
    ),
    icon: (
      <span className="inline-block w-6 h-6 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full mr-2" />
    ),
    bg: "bg-[#0f181f]",
    border: "border-green-400",
  },
  {
    title: "Contextual Reasoning",
    description: "Provides AI-generated explanations for connections",
    icon: (
      <span className="inline-block w-6 h-6 bg-gradient-to-tr from-cyan-400 to-blue-400 rounded-full mr-2" />
    ),
    bg: "bg-[#101820]",
    border: "border-cyan-400",
  },
  {
    title: "Interactive Exploration",
    description: (
      <>
        Users query in natural language.
        <br />
        Results include visual graphs and cited sources for transparency.
      </>
    ),
    icon: (
      <span className="inline-block w-6 h-6 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full mr-2" />
    ),
    bg: "bg-[#101820]",
    border: "border-blue-400",
  },
];
const feature = features[0];

export default function GovDocLexFeatures() {
  return (
    <div className="bg-[#0b1016]  flex flex-col justify-center items-center px-5">
      {" "}
      <div className="  text-white font-sans px-4 py-10 grid grid-cols-1 md:grid-cols-[30%_70%] mx-auto  items-center max-w-[1920px] gap-5 ">
        {/* Feature Cards */}
        <div className=" w-full">
          {feature && (
            <div
              key={feature.title}
              className={`flex-1 rounded-2xl shadow-lg p-6  ${feature.border} ${feature.bg} h-full`}
            >
              <div className="flex items-center mb-3">
                {feature.icon}
                <span className="font-semibold text-2xl">{feature.title}</span>
              </div>
              <div className="text-gray-300 text-lg">{feature.description}</div>
              <div className="flex justify-center  mt-4 ">
                    <img
                        src={extractimg}
                        alt="Feature Illustration"
                        className="rounded-2xl w-full "
                    />
                </div>
            </div>
            
          )}
        </div>

        <div className=" h-full">
          <div className="flex flex-col md:flex-row gap-6 mb-10  w-full">
            {features.slice(1).map((f) => (
              <div
                key={f.title}
                className={`flex-1 rounded-2xl shadow-lg p-6 border-l-4 ${f.border} ${f.bg} `}
              >
                <div className="flex items-center mb-3">
                  {f.icon}
                  <span className="font-semibold text-2xl">{f.title}</span>
                </div>
                <div className="text-gray-300 text-lg">{f.description}</div>
              </div>
            ))}
          </div>
          {/* Main Title */}
          <div className="mb-4">
            <span className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 text-lg px-3 py-1 rounded-full mb-2">
              Our Features
            </span>
            <h2 className="text-3xl md:text-6xl font-bold text-white mb-2">
              Why <span className="text-cyan-400">GovDocLex?</span> It&apos;s
              Faster, Smarter and Stronger
            </h2>
          </div>

          {/* Bullet Points */}
          <div className="bg-[#101820] rounded-xl shadow-lg p-6  w-full text-lg">
            <ul className="list-disc list-inside space-y-2 text-gray-200">
              <li>
                <span className="font-bold text-cyan-400">
                  For Legal Professionals:
                </span>{" "}
                Trace policy evolution across decades of Gazettes in minutes.
              </li>
              <li>
                <span className="font-bold text-cyan-400">For Government:</span>{" "}
                Audit regulatory compliance by mapping circulars to parent Acts.
              </li>
              <li>
                <span className="font-bold text-cyan-400">
                  For Researchers:
                </span>{" "}
                Discover hidden relationships between policies with AI-assisted
                analysis.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
