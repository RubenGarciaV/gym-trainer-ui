import { ChevronDown } from "lucide-react";

interface SelectProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

const Select = ({ options, selected, onChange }: SelectProps) => {
  return (
    <div className="relative w-full min-w-0 sm:w-48">
      <select
        className="block w-full min-w-0 cursor-pointer appearance-none rounded-md border border-sky-600 bg-white px-3 py-2 pr-9 text-sm hover:bg-white focus:outline-none"
        value={selected}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
    </div>
  );
}

export default Select;
