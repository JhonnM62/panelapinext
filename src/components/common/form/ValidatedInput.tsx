import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  error?: string | null;
  description?: string;
  required?: boolean;
  icon?: React.ReactNode;
  onChange: (value: string) => void;
  value: string;
}

export default function ValidatedInput({
  label,
  error,
  description,
  required = false,
  icon,
  onChange,
  value,
  className,
  ...props
}: ValidatedInputProps) {
  const hasError = Boolean(error);

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <Input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'transition-all duration-200',
          hasError && 'border-red-500 focus:border-red-500',
          className
        )}
      />
      
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {description && !error && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
