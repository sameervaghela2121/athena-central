enum TypographyVariant {
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "subtitle1",
  "subtitle2",
  "body1",
  "body2",
  "caption",
}

type InvertTypeOf = keyof typeof TypographyVariant;

interface Props {
  variant: InvertTypeOf;
  className?: string;
  children: React.ReactNode;
}

const Typography: React.FC<Props> = ({ variant, children, className }) => {
  // Define styles for different typography variants
  const styles: { [key: string]: string } = {
    h1: "text-4xl font-bold",
    h2: "text-3xl font-bold",
    h3: "text-2xl font-bold",
    h4: "text-xl font-bold",
    h5: "text-lg font-bold",
    h6: "text-base font-bold",
    subtitle1: "text-lg",
    subtitle2: "text-md",
    body1: "text-base",
    body2: "text-sm",
    caption: "text-xs",
  };

  // Get the appropriate style based on the variant
  const textStyle = styles[variant] || styles["body1"];

  return <div className={`${textStyle} ${className}`}>{children}</div>;
};

export default Typography;
