import { banks } from '../lib/payments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
export function BankSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <input name="bankCode" type="hidden" value={value} />
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="bank-picker" className="payment-select-trigger" aria-label="ธนาคาร">
          <SelectValue placeholder="เลือกธนาคาร" />
        </SelectTrigger>
        <SelectContent className="bank-select-menu" position="popper" sideOffset={6}>
          {banks.map((bank) => (
            <SelectItem
              key={bank.code}
              value={bank.code}
              textValue={bank.name}
              className="bank-select-item"
            >
              <span className="bank-option-label">
                <span className="bank-logo" style={{ backgroundColor: bank.color }}>
                  <img src={bank.logo} alt="" width={32} height={32} />
                </span>
                <span className="bank-option-name">{bank.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
