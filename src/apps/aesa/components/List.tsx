import React from 'react';

interface ListProps {
  items: string[];
  dark?: boolean;
  isSlide?: boolean;
}

export const List: React.FC<ListProps> = ({ items, dark = false, isSlide = false }) => (
  <ul className={isSlide ? "space-y-3" : "space-y-3"}>
    {(items || []).map((item, idx) => (
      <li key={idx} className={`flex items-start break-keep leading-relaxed ${isSlide ? 'text-[17px]' : 'text-lg'} ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
        <span className="text-blue-600 mr-3 mt-1.5 flex-shrink-0 text-xs">●</span>
        <span className={isSlide ? "font-medium" : ""}>{item}</span>
      </li>
    ))}
  </ul>
);
