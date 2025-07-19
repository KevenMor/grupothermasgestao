/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMaskInput } from 'react-imask';
import { forwardRef } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

const CPFMask = forwardRef<HTMLInputElement, TextFieldProps>(function CPFMask(props, ref) {
  return (
    <TextField
      {...props}
      InputProps={{
        inputComponent: IMaskInput as any,
        inputProps: {
          mask: "000.000.000-00",
          overwrite: true,
          unmask: false,
          lazy: false,
          prepare: (str: string) => str.replace(/\D/g, ''),
        },
      }}
      inputRef={ref}
    />
  );
});

CPFMask.displayName = 'CPFMask';

export default CPFMask; 