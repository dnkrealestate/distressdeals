'use client'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import PhoneInput, { type PhoneInputProps } from './PhoneInput'
import { phoneRule, type PhoneKind } from '@/lib/phone'

// PhoneInput for a react-hook-form form: the number is checked on submit (and the form will not send a wrong one).
export default function PhoneField<T extends FieldValues>({ control, name = 'phone' as Path<T>, required = false, kind = 'any', ...rest }: {
  control: Control<T>; name?: Path<T>; required?: boolean; kind?: PhoneKind
} & Omit<PhoneInputProps, 'value' | 'onChange' | 'onBlur' | 'error' | 'required' | 'kind' | 'name'>) {
  return (
    <Controller name={name} control={control} rules={{ validate: phoneRule({ required, kind }) as any }}
      render={({ field, fieldState }) => (
        <PhoneInput {...rest} ref={field.ref} value={field.value || ''} onChange={field.onChange} onBlur={field.onBlur}
          required={required} kind={kind} error={fieldState.error?.message} />
      )} />
  )
}
