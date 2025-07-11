import { useEffect } from "react";

/**
 * @param {*} ref
 * @param {*} buttonRef
 * @param {*} callback
 */
const useOutsideClick = (ref: any, callback: () => void, buttonRef?: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const handleClickOutside = (evt: { target: any }) => {
      if (ref.current && !ref.current.contains(evt.target) && (!buttonRef || !buttonRef.current?.contains(evt.target as Node))) {
        callback(); 
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback, buttonRef]);
};

export default useOutsideClick;
