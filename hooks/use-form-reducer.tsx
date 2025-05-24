'use client';

import { useReducer } from 'react';

// Define action types
export type FormAction =
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'SET_FORM'; data: any }
  | { type: 'RESET_FORM' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_SUCCESS'; success: boolean };

// Define state type
export interface FormState<T> {
  data: T;
  initialData: T;
  loading: boolean;
  error: string | null;
  success: boolean;
  isDirty: boolean;
}

// Create reducer function
function formReducer<T>(state: FormState<T>, action: FormAction): FormState<T> {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        data: {
          ...state.data,
          [action.field]: action.value,
        },
        isDirty: true,
      };
    case 'SET_FORM':
      return {
        ...state,
        data: action.data,
        initialData: action.data,
        isDirty: false,
      };
    case 'RESET_FORM':
      return {
        ...state,
        data: state.initialData,
        error: null,
        success: false,
        isDirty: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.loading,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        loading: false,
        success: false,
      };
    case 'SET_SUCCESS':
      return {
        ...state,
        success: action.success,
        loading: false,
        error: null,
        isDirty: false,
      };
    default:
      return state;
  }
}

// Create custom hook
export function useFormReducer<T>(initialData: T) {
  const [state, dispatch] = useReducer(formReducer<T>, {
    data: initialData,
    initialData,
    loading: false,
    error: null,
    success: false,
    isDirty: false,
  });

  // Helper functions
  const setField = (field: string, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const setForm = (data: T) => {
    dispatch({ type: 'SET_FORM', data });
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  };

  const setSuccess = (success: boolean) => {
    dispatch({ type: 'SET_SUCCESS', success });
  };

  return {
    state,
    setField,
    setForm,
    resetForm,
    setLoading,
    setError,
    setSuccess,
  };
}
