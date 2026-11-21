import { Spinner } from './ui/spinner';
import { Search, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
};

export function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = 'ค้นหา',
  label = 'ค้นหา',
  disabled,
}: Props) {
  return (
    <form
      className="search-bar"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) onSearch();
      }}
    >
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      <Button className="primary" type="submit" disabled={disabled}>
        {disabled ? <Spinner aria-hidden="true" /> : <Search size={16} />}
        ค้นหา
      </Button>
      <Button className="outline" type="button" onClick={onClear} disabled={disabled}>
        <RotateCcw size={16} />
        ล้าง
      </Button>
    </form>
  );
}
