/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMaskInput } from 'react-imask';
import { forwardRef } from 'react';

const CPFMask = forwardRef<HTMLInputElement, any>(function CPFMask(props, ref) {
  return (
    <IMaskInput
      {...props}
      mask="000.000.000-00"
      inputRef={ref as React.Ref<HTMLInputElement>}
      overwrite
    />
  );
});

CPFMask.displayName = 'CPFMask';

export default CPFMask; 