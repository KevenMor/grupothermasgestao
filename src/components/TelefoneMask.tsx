/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMaskInput } from 'react-imask';
import { forwardRef } from 'react';

const TelefoneMask = forwardRef<HTMLInputElement, any>(function TelefoneMask(props, ref) {
  return (
    <IMaskInput
      {...props}
      mask="(00) 00000-0000"
      inputRef={ref as React.Ref<HTMLInputElement>}
      overwrite
    />
  );
});

TelefoneMask.displayName = 'TelefoneMask';

export default TelefoneMask; 