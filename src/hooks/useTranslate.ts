import { useTranslation } from "react-i18next";
import en from "../i18n/translations/en.json";

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKey = NestedKeyOf<typeof en>;

const useTranslate = () => {
  const { t, i18n } = useTranslation();

  const translateWithSuggestions = t as (
    key: TranslationKey,
    options?: any,
  ) => string;

  return {
    translate: translateWithSuggestions,
    i18n,
  };
};

export default useTranslate;
