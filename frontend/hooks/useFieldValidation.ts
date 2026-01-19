import { useState, useCallback } from 'react';
import { FIELD_VALIDATION_MESSAGES } from '../utils/errorMessages';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  validate?: (value: any) => string | null;
}

interface FieldValidation {
  value: any;
  error: string | null;
  isValid: boolean;
  showError: boolean;
}

interface UseFieldValidationReturn {
  fields: Record<string, FieldValidation>;
  errors: Record<string, string>;
  isValid: boolean;
  setFieldValue: (fieldName: string, value: any) => void;
  setFieldError: (fieldName: string, error: string | null) => void;
  validateField: (fieldName: string, value?: any) => boolean;
  validateAll: () => boolean;
  resetField: (fieldName: string) => void;
  resetAll: () => void;
}

export const useFieldValidation = (
  validationRules: Record<string, ValidationRule>,
  initialValues: Record<string, any> = {}
): UseFieldValidationReturn => {
  const [fields, setFields] = useState<Record<string, FieldValidation>>(() => {
    const initialFields: Record<string, FieldValidation> = {};
    Object.keys(validationRules).forEach(fieldName => {
      initialFields[fieldName] = {
        value: initialValues[fieldName] ?? '',
        error: null,
        isValid: true,
        showError: false
      };
    });
    return initialFields;
  });

  const validateField = useCallback((fieldName: string, value?: any): boolean => {
    const fieldValue = value !== undefined ? value : fields[fieldName].value;
    const rule = validationRules[fieldName];
    if (!rule) return true;

    let error: string | null = null;

    // Check required
    if (rule.required && (!fieldValue || String(fieldValue).trim() === '')) {
      error = FIELD_VALIDATION_MESSAGES[fieldName]?.required || 'This field is required';
    }
    // Check minLength
    else if (rule.minLength && typeof fieldValue === 'string' && fieldValue.length < rule.minLength) {
      error = FIELD_VALIDATION_MESSAGES[fieldName]?.minLength || `Must be at least ${rule.minLength} characters`;
    }
    // Check maxLength
    else if (rule.maxLength && typeof fieldValue === 'string' && fieldValue.length > rule.maxLength) {
      error = FIELD_VALIDATION_MESSAGES[fieldName]?.maxLength || `Must be ${rule.maxLength} characters or less`;
    }
    // Check pattern
    else if (rule.pattern && typeof fieldValue === 'string' && !rule.pattern.test(fieldValue)) {
      error = FIELD_VALIDATION_MESSAGES[fieldName]?.pattern || 'Contains invalid characters';
    }
    // Check min value
    else if (rule.min !== undefined && typeof fieldValue === 'number' && fieldValue < rule.min) {
      error = FIELD_VALIDATION_MESSAGES[fieldName]?.min || `Must be at least ${rule.min}`;
    }
    // Check max value
    else if (rule.max !== undefined && typeof fieldValue === 'number' && fieldValue > rule.max) {
      error = FIELD_VALIDATION_MESSAGES[fieldName]?.max || `Must be ${rule.max} or less`;
    }
    // Run custom validation
    else if (rule.validate) {
      error = rule.validate(fieldValue);
    }

    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value: fieldValue,
        error,
        isValid: !error,
        showError: true
      }
    }));

    return !error;
  }, [fields, validationRules]);

  const validateAll = useCallback((): boolean => {
    let allValid = true;
    Object.keys(validationRules).forEach(fieldName => {
      const isValid = validateField(fieldName);
      if (!isValid) {
        allValid = false;
      }
    });
    return allValid;
  }, [validationRules, validateField]);

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        showError: false // Reset error visibility when user starts typing
      }
    }));
  }, []);

  const setFieldError = useCallback((fieldName: string, error: string | null) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error,
        isValid: !error
      }
    }));
  }, []);

  const resetField = useCallback((fieldName: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        value: initialValues[fieldName] ?? '',
        error: null,
        isValid: true,
        showError: false
      }
    }));
  }, [initialValues]);

  const resetAll = useCallback(() => {
    setFields(() => {
      const resetFields: Record<string, FieldValidation> = {};
      Object.keys(validationRules).forEach(fieldName => {
        resetFields[fieldName] = {
          value: initialValues[fieldName] ?? '',
          error: null,
          isValid: true,
          showError: false
        };
      });
      return resetFields;
    });
  }, [initialValues, validationRules]);

  const errors: Record<string, string> = {};
  let isValid = true;
  Object.entries(fields).forEach(([fieldName, field]) => {
    if (field.error) {
      errors[fieldName] = field.error;
      isValid = false;
    }
  });

  return {
    fields,
    errors,
    isValid,
    setFieldValue,
    setFieldError,
    validateField,
    validateAll,
    resetField,
    resetAll
  };
};