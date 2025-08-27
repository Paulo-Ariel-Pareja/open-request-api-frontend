import { useState, useCallback } from "react";
import { KeyValuePair } from "./RequestBuilderUtils";

export const useKeyValuePairs = (initialPairs: KeyValuePair[]) => {
  const [pairs, setPairs] = useState<KeyValuePair[]>(initialPairs);

  const updatePair = useCallback((
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => {
    setPairs(prev => {
      const newPairs = [...prev];
      newPairs[index] = { ...newPairs[index], [field]: value };
      return newPairs;
    });
  }, []);

  const addPair = useCallback(() => {
    setPairs(prev => [...prev, { key: "", value: "", enabled: true }]);
  }, []);

  const removePair = useCallback((index: number) => {
    setPairs(prev => {
      const newPairs = prev.filter((_, i) => i !== index);
      return newPairs.length > 0 ? newPairs : [{ key: "", value: "", enabled: true }];
    });
  }, []);

  return { pairs, setPairs, updatePair, addPair, removePair };
};
