import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ValidatedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label: string;
  error?: string | null;
  description?: string;
  required?: boolean;
  icon?: React.ReactNode;
  onChange: (value: string) => void;
  value: string;
  maxLength?: number;
  showCharCount?: boolean;
}

export default function ValidatedTextarea({
  label,
  error,
  description,
  required = false,
  icon,
  onChange,
  value,
  maxLength,
  showCharCount = false,
  className,
  ...props
}: ValidatedTextareaProps) {
  const hasError = Boolean(error);
  const characterCount = value.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={props.id} className="flex items-center gap-2">
          {icon}
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        
        {showCharCount && maxLength && (
          <Badge 
            variant={isNearLimit ? "destructive" : "outline"}
            className="text-xs"
          >
            {characterCount}/{maxLength}
          </Badge>
        )}
      </div>
      
      <Textarea
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className={cn(
          'transition-all duration-200 min-h-[100px]',
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
