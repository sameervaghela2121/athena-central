import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import allImgPaths from "@/assets";
import Modal from "./Modal";
import { ButtonV2, Checkbox } from "@/components";

interface OnboardingModalProps {
  show: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ show, onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isChecked, setIsChecked] = useState(false);

  const steps = [
    {
      title: "Welcome to AthenaPro",
      subtitle: "Your AI-Powered Knowledge Management System",
      content: (
        <div className="bg-tertiary-50/50 rounded-2xl px-6 py-6 mb-6">
          <h2 className="text-[32px] text-primary-900 font-bold pb-5">
            <span className="text-[32px] text-primary-900 font-bold italic">
              Welcome to
            </span>{" "}
            AthenaPro
          </h2>
          <p className="text-xl text-black font-medium pb-1">
            Getting Started with AthenaPro
          </p>
          <p className="text-tertiary-900 text-base font-normal">
            AthenaPro is your intelligent knowledge management system designed to help you organize,
            access, and leverage your organization's knowledge more effectively.
            Let's get you set up with the basics to make the most of the platform.
          </p>
        </div>
      ),
      footer: (
        <ButtonV2
          rightIcon={allImgPaths.rightArrow}
          className="w-full"
          onClick={() => setCurrentStep(1)}
        >
          Next
        </ButtonV2>
      ),
    },
    {
      title: "Key Features",
      subtitle: "Discover what you can do with AthenaPro",
      content: (
        <div className="bg-tertiary-50/50 rounded-2xl px-6 py-6 overflow-y-auto max-h-[400px]">
          <div className="mb-8 last:mb-0">
            <div className="flex items-center gap-x-2 mb-2">
              <img className="w-5 h-5" src={allImgPaths.lock} alt="" />
              <p className="text-xl text-tertiary-900 font-semibold leading-none">
                Knowledge Management
              </p>
            </div>
            <p className="text-tertiary-900 text-base font-normal">
              Create, organize, and share knowledge entries across your organization.
              Easily find information when you need it most.
            </p>
          </div>

          <div className="mb-8 last:mb-0">
            <div className="flex items-center gap-x-2 mb-2">
              <img className="w-5 h-5" src={allImgPaths.lock} alt="" />
              <p className="text-xl text-tertiary-900 font-semibold leading-none">
                AI-Powered Chat
              </p>
            </div>
            <p className="text-tertiary-900 text-base font-normal">
              Get instant answers to your questions using our AI assistant that leverages
              your organization's knowledge base.
            </p>
          </div>

          <div className="mb-8 last:mb-0">
            <div className="flex items-center gap-x-2 mb-2">
              <img className="w-5 h-5" src={allImgPaths.lock} alt="" />
              <p className="text-xl text-tertiary-900 font-semibold leading-none">
                Team Collaboration
              </p>
            </div>
            <p className="text-tertiary-900 text-base font-normal">
              Work together with your team to build and refine your knowledge base.
              Share insights and improve collective knowledge.
            </p>
          </div>

          <div className="mb-8 last:mb-0">
            <div className="flex items-center gap-x-2 mb-2">
              <img className="w-5 h-5" src={allImgPaths.lock} alt="" />
              <p className="text-xl text-tertiary-900 font-semibold leading-none">
                Analytics & Insights
              </p>
            </div>
            <p className="text-tertiary-900 text-base font-normal">
              Track usage patterns and identify knowledge gaps to continuously
              improve your knowledge management strategy.
            </p>
          </div>
        </div>
      ),
      footer: (
        <div className="flex gap-4">
          <ButtonV2
            variant="secondary"
            className="w-1/2"
            onClick={() => setCurrentStep(0)}
          >
            Back
          </ButtonV2>
          <ButtonV2
            rightIcon={allImgPaths.rightArrow}
            className="w-1/2"
            onClick={() => setCurrentStep(2)}
          >
            Next
          </ButtonV2>
        </div>
      ),
    },
    {
      title: "Terms & Conditions",
      subtitle: "Please review and accept our terms",
      content: (
        <div className="bg-tertiary-50/50 rounded-2xl px-6 py-6 overflow-y-auto max-h-[400px]">
          <div className="mb-8 last:mb-0">
            <div className="flex items-center gap-x-2 mb-2">
              <img className="w-5 h-5" src={allImgPaths.lock} alt="" />
              <p className="text-xl text-tertiary-900 font-semibold leading-none">
                Data Privacy
              </p>
            </div>
            <p className="text-tertiary-900 text-base font-normal">
              We take your data privacy seriously. All information stored in AthenaPro
              is handled according to our privacy policy and applicable data protection laws.
            </p>
          </div>

          <div className="mb-8 last:mb-0">
            <div className="flex items-center gap-x-2 mb-2">
              <img className="w-5 h-5" src={allImgPaths.lock} alt="" />
              <p className="text-xl text-tertiary-900 font-semibold leading-none">
                User Responsibility
              </p>
            </div>
            <p className="text-tertiary-900 text-base font-normal">
              Users are responsible for the content they create and share on the platform.
              Please ensure all content complies with your organization's policies.
            </p>
          </div>

          <div className="mb-8 last:mb-0">
            <div className="flex items-center gap-x-2 mb-2">
              <img className="w-5 h-5" src={allImgPaths.lock} alt="" />
              <p className="text-xl text-tertiary-900 font-semibold leading-none">
                Compliance
              </p>
            </div>
            <p className="text-tertiary-900 text-base font-normal">
              Users must ensure their use of AthenaPro complies with all applicable laws and regulations.
              It should not be used for illegal or unethical purposes.
            </p>
          </div>
        </div>
      ),
      footer: (
        <div>
          <div className="mb-4">
            <label
              htmlFor="terms-agreement"
              className="flex items-center gap-x-3 cursor-pointer select-none"
            >
              <Checkbox
                id="terms-agreement"
                onChange={() => setIsChecked((prev) => !prev)}
                checked={isChecked}
              />
              <p className="text-base text-tertiary-900 font-medium">
                I agree to the terms and conditions
              </p>
            </label>
          </div>
          <div className="flex gap-4">
            <ButtonV2
              variant="secondary"
              className="w-1/2"
              onClick={() => setCurrentStep(1)}
            >
              Back
            </ButtonV2>
            <ButtonV2
              rightIcon={allImgPaths.rightArrow}
              className="w-1/2"
              onClick={() => {
                if (isChecked) {
                  // Save user preference to localStorage to prevent showing again
                  localStorage.setItem("onboardingCompleted", "true");
                  onClose();
                }
              }}
              disabled={!isChecked}
            >
              Get Started
            </ButtonV2>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <Modal show={show} onClose={onClose} size="xl" backdrop={false}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary-900">
              {currentStepData.title}
            </h2>
            <p className="text-tertiary-900">{currentStepData.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentStep
                    ? "bg-primary-900"
                    : "bg-secondary-200"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mb-6">{currentStepData.content}</div>

        <div>{currentStepData.footer}</div>
      </div>
    </Modal>
  );
};

export default OnboardingModal;
