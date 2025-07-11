import React from "react";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }: { error: any }) {
  console.error("error =>", error);

  return (
    <div role="alert">
      {/* <Modal showModal={Boolean(error.message)}>
        <SomethingWentWrong />
      </Modal> */}
    </div>
  );
}

const logError: any = (error: Error) => {
  // Do something with the error, e.g. log to an external API
  return error;
};

const ErrorBoundaryProvider = ({ children }: { children: any }) => {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
      {/* <BugsnagErrorBoundary> */}
      {children}
      {/* </BugsnagErrorBoundary> */}
    </ErrorBoundary>
  );
};

export default React.memo(ErrorBoundaryProvider);
