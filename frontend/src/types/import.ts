import React from 'react';

export interface AlertMessage {
  type: 'success' | 'error';
  text: string;
}

export interface ImportType {
  id: string;
  label: string;
  icon: React.ElementType;
}

export interface ValidationError {
  sheet: string;
  row: number;
  message: string;
}