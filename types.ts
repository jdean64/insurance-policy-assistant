import React from 'react';

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string | React.ReactNode;
}