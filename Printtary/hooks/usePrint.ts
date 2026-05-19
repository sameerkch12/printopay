import { useContext } from 'react';
import { PrintContext } from '@/contexts/PrintContext';

export function usePrint() {
  const context = useContext(PrintContext);
  if (!context) {
    throw new Error('usePrint must be used within PrintProvider');
  }
  return context;
}
