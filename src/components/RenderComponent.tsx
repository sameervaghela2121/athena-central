import { size } from "lodash-es";
import Empty from "./Empty";

const RenderComponent = ({
  isLoading,
  loaderComponent,
  render,
  data,
  description,
  type = "list",
}: {
  isLoading: boolean;
  loaderComponent: any;
  render: any;
  data: any[];
  description: any;
  type?: "list" | "table";
}) => {
  const Render = () => {
    switch (type) {
      case "list":
        return data.map(render);
      case "table":
        return render();

      default:
        return <></>;
    }
  };
  return (
    <>
      {isLoading && loaderComponent}
      {!isLoading && size(data) <= 0 && (
        <div className="flex items-center justify-center w-full h-full">
          <Empty description={description} />
        </div>
      )}
      {!isLoading && size(data) > 0 && <Render />}
    </>
  );
};

export default RenderComponent;
