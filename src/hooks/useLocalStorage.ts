import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { readStorage, writeStorage } from "../lib/storage";

export function useLocalStorage(
  key: string,
  fallback: string,
): [string, Dispatch<SetStateAction<string>>] {
  const [value, setValue] = useState(() => readStorage(key, fallback));

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}
