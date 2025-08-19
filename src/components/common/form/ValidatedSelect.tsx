import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export interface ValidatedSelectProps {
  label: string;
  error?: string | null;
  description?: string;
  required?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  renderOption?: (option: SelectOption) => React.ReactNode;
}

export default function ValidatedSelect({
  label,
  error,
  description,
  required = false,
  icon,
  placeholder = "Selecciona una opción",
  options,
  value,
  onChange,
  disabled = false,
  className,
  renderOption
}: ValidatedSelectProps) {
  const hasError = Boolean(error);

  const defaultRenderOption = (option: SelectOption) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{option.label}</span>
          {option.badge && (
            <Badge variant="secondary" className="text-xs">
              {option.badge}
            </Badge>
          )}
        </div>
        {option.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {option.description}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger 
          className={cn(
            'transition-all duration-200',
            hasError && 'border-red-500 focus:border-red-500',
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {renderOption ? renderOption(option) : defaultRenderOption(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
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
