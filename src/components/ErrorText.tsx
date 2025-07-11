import { upperFirst } from "lodash-es";
import { get } from "react-hook-form";

const ErrorText = ({
  errors,
  name,
}: {
  errors: any;
  name: string | undefined;
}) => {
  return (
    <>
      {get(errors, `${name}.message`) && (
        <span className="text-sm text-red-600 select-none">
          {upperFirst(get(errors, `${name}.message`, ""))}
        </span>
      )}
    </>
  );
};

// export default React.memo(ErrorText);
export default ErrorText;
