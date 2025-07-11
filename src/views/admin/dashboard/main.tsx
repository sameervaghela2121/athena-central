import allImgPaths from "@/assets";
import { PermissionGate } from "@/components";
import Dropdown from "@/components/Dropdown";
import UnauthorizedAccess from "@/components/UnauthorizedAccess";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { ACTION, DURATION_OPTIONS, PAGES } from "@/shared/constants";
import { useMemo } from "react";
import ActiveNewUsersChart from "./components/ActiveNewUsersChart";
import FeedbackVote from "./components/FeedbackVote";
import KnowledgeBaseUtilization from "./components/KnowledgeBaseUtilization";
import Questions from "./components/Questions";
import QueueAnalytics from "./components/QueueAnalytics";
import TokenUsage from "./components/TokenUsage";
import TopKEs from "./components/TopKEs";
import TopQuestionHandlers from "./components/TopQuestionHandlers";
import UserEngagementRateAndRawQuestion from "./components/UserEngagementRateAndRawQuestion";
import UserRetentionAndChurnRate from "./components/UserRetentionAndChurnRate";
import WidgetCard from "./components/WidgetCard";

const Dashboard = () => {
  const { translate } = useTranslate();

  const { changeDuration, duration } = useAppState(RootState.DASHBOARD);
  const {
    user: {
      preferences: { language },
    },
  } = useAppState(RootState.AUTH);

  const durationOptions = useMemo(() => {
    return DURATION_OPTIONS.map((option) => ({
      id: option.id,
      name: translate(`common.durationOptions.${option.key}` as any),
      key: option.key,
    }));
  }, [language]);

  return (
    <PermissionGate
      action={ACTION.READ}
      page={PAGES.DASHBOARD}
      errorComponent={
        <UnauthorizedAccess
          header={translate("questions.restrictedMsg.heading")}
          message={translate("questions.restrictedMsg.message")}
        />
      }
    >
      <div className="w-full h-[calc(100vh_-_120px)] overflow-y-auto flex-grow p-7 gap-y-6 flex flex-col">
        <div className="flex justify-end w-full cursor-default">
          <div>
            <Dropdown
              preFixIcon={allImgPaths.calendarDarkIcon}
              className="w-full"
              btnName="border-none !cursor-default"
              items={[]}
              label={<>{durationOptions[0].name}</>}
              selectedItem={duration || durationOptions[0]}
              hideCarat={true}
              onSelect={(val: any) => {
                changeDuration(val);
              }}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 md:grid-cols-1">
          {/* <div className="col-span-2 w-full">
            <Overview />
          </div> */}
          {/* <WidgetCard>
            <TopQuestionHandlers />
          </WidgetCard> */}

          <WidgetCard>
            <ActiveNewUsersChart />
          </WidgetCard>
          <WidgetCard>
            <UserRetentionAndChurnRate />
          </WidgetCard>
          <WidgetCard>
            <TopQuestionHandlers />
          </WidgetCard>
          <WidgetCard>
            <QueueAnalytics />
          </WidgetCard>
          <WidgetCard>
            <Questions />
          </WidgetCard>
          <WidgetCard>
            <UserEngagementRateAndRawQuestion />
          </WidgetCard>
          <WidgetCard>
            <TopKEs />
          </WidgetCard>
          <WidgetCard>
            <KnowledgeBaseUtilization />
          </WidgetCard>
          <WidgetCard>
            <TokenUsage />
          </WidgetCard>
          <WidgetCard>
            <FeedbackVote />
          </WidgetCard>
        </div>
      </div>
    </PermissionGate>
  );
};

export default Dashboard;
