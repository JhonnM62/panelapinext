import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export interface ValidatedSliderProps {
  label: string;
  error?: string | null;
  description?: string;
  required?: boolean;
  icon?: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  showValue?: boolean;
  valueUnit?: string;
  marks?: Array<{ value: number; label: string }>;
}

export default function ValidatedSlider({
  label,
  error,
  description,
  required = false,
  icon,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  formatValue,
  showValue = true,
  valueUnit = '',
  marks
}: ValidatedSliderProps) {
  const hasError = Boolean(error);

  const displayValue = formatValue ? formatValue(value) : `${value}${valueUnit}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {icon}
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        
        {showValue && (
          <Badge variant="outline" className="text-sm font-mono">
            {displayValue}
          </Badge>
        )}
      </div>
      
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full"
        />
        
        {marks && (
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            {marks.map((mark) => (
              <span key={mark.value} className="text-center">
                {mark.label}
              </span>
            ))}
          </div>
        )}
      </div>
      
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
