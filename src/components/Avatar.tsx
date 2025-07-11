const Avatar = ({
  image,
  variant = "circular",
  classes = "",
}: {
  image: string;
  variant: "circular" | "rounded" | "square";
  classes: string;
}) => {
  const getVariant = () => {
    switch (variant) {
      case "circular":
        return "rounded-full";
      case "rounded":
        return `rounded-md`;
      default:
        return "";
    }
  };
  return (
    <img
      src={image}
      alt=""
      className={`shadow-sm ${getVariant()} ${classes}`}
    />
  );
};

export default Avatar;
