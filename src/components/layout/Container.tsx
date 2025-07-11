const Container = ({
  children,
  containerClass,
}: {
  children: any;
  containerClass?: string;
}) => {
  return (
    <div
      className={`w-full h-[calc(100vh_-_80px)] lg:px-14 md:px-5 ${containerClass}`}
    >
      {children}
    </div>
  );
};

export const Body = ({ children }: { children: any }) => {
  return <div className="w-full h-full">{children}</div>;
};

Container.Body = Body;

export default Container;
