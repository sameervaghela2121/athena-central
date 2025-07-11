import { ButtonV2 } from "@/components";
import Typography from "@/components/Typography";
import AuthLayout from "@/components/layout/AuthLayout";

interface AuthSuccessScreenProps {
  icon: string;
  title: string;
  subtitle: string;
  description?: string;
  buttonText: string;
  onButtonClick: () => void;
}

const AuthSuccessScreen = ({
  icon,
  title,
  subtitle,
  description,
  buttonText,
  onButtonClick,
}: AuthSuccessScreenProps) => {
  return (
    <AuthLayout className="p-6">
      <div className="w-full">
        <div className="flex justify-center mb-6 bg-secondary-900 rounded-2xl p-6">
          <img src={icon} alt="Success" className="w-20 h-20" />
        </div>

        <div className="space-y-2">
          <Typography
            variant="h1"
            className="text-2xl font-bold text-secondary-900 sm:text-3xl text-center md:text-left"
          >
            {title}
          </Typography>
          <Typography
            variant="body1"
            className="mt-4 text-left text-gray-600 font-semibold"
          >
            {subtitle}
          </Typography>
        </div>
        {description && (
          <Typography variant="body1" className="mt-6 text-left text-gray-600">
            {description}
          </Typography>
        )}
        <div className="mt-6">
          <ButtonV2
            onClick={onButtonClick}
            variant="secondary"
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-full"
          >
            {buttonText}
          </ButtonV2>
        </div>
      </div>
    </AuthLayout>
  );
};

export default AuthSuccessScreen;
