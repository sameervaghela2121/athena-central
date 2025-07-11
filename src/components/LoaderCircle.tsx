import { useTranslate } from "@/hooks";
import React from "react";

const LoaderCircle = ({ text = "", className = "" }) => {
  const { translate } = useTranslate();

  return (
    <div
      className={`flex flex-col gap-y-4 justify-center items-center ${className}`}
    >
      <div>
        <svg
          className="animate-spin"
          width="60"
          height="59"
          viewBox="0 0 60 59"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M59.5 29.5C59.5 45.7924 46.2924 59 30 59C13.7076 59 0.5 45.7924 0.5 29.5C0.5 13.2076 13.7076 0 30 0C46.2924 0 59.5 13.2076 59.5 29.5ZM9.20299 29.5C9.20299 40.9859 18.5141 50.297 30 50.297C41.4859 50.297 50.797 40.9859 50.797 29.5C50.797 18.0141 41.4859 8.70299 30 8.70299C18.5141 8.70299 9.20299 18.0141 9.20299 29.5Z"
            className="fill-primary-900/20"
          />
          <path
            d="M55.1488 29.5C57.5519 29.5 59.5329 27.5415 59.1797 25.1645C58.8257 22.7819 58.1804 20.4463 57.2544 18.2108C55.7719 14.6317 53.599 11.3797 50.8596 8.64035C48.1203 5.90102 44.8683 3.72807 41.2892 2.24555C39.0537 1.31961 36.7181 0.674327 34.3355 0.320327C31.9585 -0.0328552 30 1.94812 30 4.35125C30 6.75438 31.9689 8.65691 34.3196 9.15603C35.5617 9.41977 36.7801 9.79734 37.9589 10.2856C40.4821 11.3308 42.7748 12.8627 44.7061 14.7939C46.6373 16.7252 48.1692 19.0179 49.2144 21.5411C49.7027 22.7199 50.0802 23.9383 50.344 25.1804C50.8431 27.5311 52.7456 29.5 55.1488 29.5Z"
            className="fill-primary-900"
          />
        </svg>
      </div>
      <div>
        <p>{text || translate("common.pleaseWait")}</p>
      </div>
    </div>
  );
};

export default React.memo(LoaderCircle);
