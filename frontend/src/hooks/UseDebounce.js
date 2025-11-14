import { useState, useEffect } from 'react';

/**
 * Hook para aplicar debounce em valores
 * Útil para evitar requisições excessivas ao digitar
 * 
 * @param {any} value - Valor a ser "debounced"
 * @param {number} delay - Delay em milissegundos (padrão: 500ms)
 * @returns {any} - Valor após o delay
 */
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Criar timer para atualizar o valor após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpar timeout se o valor mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;