import React from 'react'
import { MoreDots } from './MoreDots';

export function DropdownSection({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-2 font-medium"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            open ? "rotate-0" : "rotate-180"
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li
              key={item}
              className="px-3 py-2 hover:bg-[#1B2A36] rounded cursor-pointer flex items-center justify-between"
            >
              {item}
              {title === "Today" && item === "Social Media Growth Hacks" && (
                <MoreDots />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
