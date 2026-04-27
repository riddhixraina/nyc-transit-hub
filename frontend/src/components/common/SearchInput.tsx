type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder,
}: SearchInputProps) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-full border border-ink/10 bg-white px-5 py-3 text-sm text-ink outline-none transition focus:border-tide focus:ring-2 focus:ring-tide/20"
    />
  );
}
