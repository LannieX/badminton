import type { ComponentProps } from 'react';
import { fieldError } from '../lib/validation';

type Props = ComponentProps<'form'> & { onValidationError: (message: string) => void };
export function ValidatedForm({ onValidationError, onSubmit, onInput, ...props }: Props) {
  return (
    <form
      {...props}
      noValidate
      onInput={(event) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
          event.target.removeAttribute('aria-invalid');
        }
        onInput?.(event);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const fields = Array.from(event.currentTarget.elements).filter(
          (element): element is HTMLInputElement | HTMLSelectElement =>
            (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) &&
            !element.disabled &&
            element.type !== 'hidden',
        );
        let first: HTMLInputElement | HTMLSelectElement | undefined;
        let message = '';
        for (const field of fields) {
          const error = fieldError(field);
          if (error) {
            field.setAttribute('aria-invalid', 'true');
            if (!first) {
              first = field;
              message = error;
            }
          } else field.removeAttribute('aria-invalid');
        }
        if (first) {
          first.focus();
          onValidationError(message);
          return;
        }
        onSubmit?.(event);
      }}
    />
  );
}
