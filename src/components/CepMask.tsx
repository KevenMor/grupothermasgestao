/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMaskInput } from 'react-imask';
import { forwardRef } from 'react';

const CepMask = forwardRef<HTMLInputElement, any>(function CepMask(props, ref) {
  return (
    <IMaskInput
      {...props}
      mask="00000-000"
      inputRef={ref as React.Ref<HTMLInputElement>}
      overwrite
    />
  );
});

CepMask.displayName = 'CepMask';

export default CepMask; 