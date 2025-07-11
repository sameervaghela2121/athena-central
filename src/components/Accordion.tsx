import React, { useState } from "react";

interface AccordionItem {
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

const Accordion: React.FC<AccordionProps> = ({ items, className = "" }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className={`w-full ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="border-b">
          <button
            className="flex justify-between items-center w-full p-4 focus:outline-none"
            onClick={() => toggleAccordion(index)}
          >
            <span className="text-lg font-medium">{item.title}</span>
            <svg
              className={`w-4 h-4 transition-transform transform duration-300 ${
                openIndex === index ? "rotate-180" : "rotate-0"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={openIndex === index ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
              />
            </svg>
          </button>
          {openIndex === index && (
            <div className="p-4">
              <div className="text-gray-700">{item.content}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Accordion;
