import { useMemo } from 'react';
import type { GeminiFormData } from './useGeminiForm';

export interface ValidationRule {
  field: keyof GeminiFormData;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationError {
  field: keyof GeminiFormData;
  message: string;
}

export interface UseValidationReturn {
  errors: ValidationError[];
  isValid: boolean;
  getFieldError: (field: keyof GeminiFormData) => string | null;
  hasError: (field: keyof GeminiFormData) => boolean;
}

const defaultRules: ValidationRule[] = [
  {
    field: 'userbot',
    required: true,
    minLength: 2,
    maxLength: 50
  },
  {
    field: 'apikey',
    required: true,
    minLength: 10,
    custom: (value: string) => {
      if (!value.startsWith('AI') && !value.includes('google')) {
        return 'La API Key debe ser de Google Gemini';
      }
      return null;
    }
  },
  {
    field: 'sesionId',
    required: true
  },
  {
    field: 'promt',
    required: true,
    minLength: 10,
    maxLength: 1000
  },
  {
    field: 'phoneNumber',
    required: false,
    pattern: /^\+?[1-9]\d{1,14}$/,
    custom: (value: string) => {
      if (value && !value.startsWith('+')) {
        return 'El número debe incluir el código de país (+57)';
      }
      return null;
    }
  },
  {
    field: 'server',
    required: true,
    pattern: /^https?:\/\/.+/,
    custom: (value: string) => {
      try {
        new URL(value);
        return null;
      } catch {
        return 'URL de servidor inválida';
      }
    }
  }
];

export const useValidation = (
  formData: GeminiFormData,
  customRules: ValidationRule[] = []
): UseValidationReturn => {
  const rules = [...defaultRules, ...customRules];
  
  const errors = useMemo(() => {
    const validationErrors: ValidationError[] = [];

    rules.forEach(rule => {
      const value = formData[rule.field];
      
      // Verificar campo requerido
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        validationErrors.push({
          field: rule.field,
          message: `${rule.field} es requerido`
        });
        return;
      }

      // Si el campo está vacío y no es requerido, no validar más
      if (!value || (typeof value === 'string' && !value.trim())) {
        return;
      }

      // Verificar longitud mínima
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        validationErrors.push({
          field: rule.field,
          message: `${rule.field} debe tener al menos ${rule.minLength} caracteres`
        });
      }

      // Verificar longitud máxima
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        validationErrors.push({
          field: rule.field,
          message: `${rule.field} no puede tener más de ${rule.maxLength} caracteres`
        });
      }

      // Verificar patrón
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        validationErrors.push({
          field: rule.field,
          message: `${rule.field} tiene un formato inválido`
        });
      }

      // Verificar validación personalizada
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          validationErrors.push({
            field: rule.field,
            message: customError
          });
        }
      }
    });

    return validationErrors;
  }, [formData, rules]);

  const isValid = errors.length === 0;

  const getFieldError = (field: keyof GeminiFormData): string | null => {
    const error = errors.find(err => err.field === field);
    return error ? error.message : null;
  };

  const hasError = (field: keyof GeminiFormData): boolean => {
    return errors.some(err => err.field === field);
  };

  return {
    errors,
    isValid,
    getFieldError,
    hasError
  };
};
