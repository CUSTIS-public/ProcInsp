import { useRef } from "react";

export function useOnce(func: () => void) {
    var ref = useRef<boolean>();
    if (!ref.current) {
        func();
        ref.current = true;
    }
}
