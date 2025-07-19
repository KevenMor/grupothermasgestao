/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMaskInput } from 'react-imask';
import { forwardRef } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

const TelefoneMask = forwardRef<HTMLInputElement, TextFieldProps>(function TelefoneMask(props, ref) {
  return (
    <TextField
      {...props}
      InputProps={{
        inputComponent: IMaskInput as any,
        inputProps: {
          mask: "(00) 0000-0000",
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

TelefoneMask.displayName = 'TelefoneMask';

export default TelefoneMask; 