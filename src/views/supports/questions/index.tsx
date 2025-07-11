import { size } from "lodash-es";
import queryString from "query-string";
import { lazy, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import queuesAPI from "@/apis/queues";
import { Layout } from "@/components";
import { useTranslate } from "@/hooks";

const Questions = lazy(() => import("./main"));

const index = () => {
  const location = useLocation();
  const { translate } = useTranslate();

  const queryParams = new URLSearchParams(location.search);

  const [currentEntityQueuesList, setCurrentEntityQueuesList] = useState([]);
  const [myQueues, setMyQueues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCurrentEntityQueues = async () => {
    try {
      setIsLoading(true);
      let stringified = queryString.stringify({
        my_queues: false,
        page: 1,
        page_size: 5000,
      });

      const { data: currentEntityQueues } =
        await queuesAPI.fetchQueues(stringified);

      if (size(currentEntityQueues.data.result) > 0) {
        const list = currentEntityQueues.data.result.map((o: any) => ({
          label: o.name,
          value: o.id,
        }));

        setCurrentEntityQueuesList(list);
      } else {
        setCurrentEntityQueuesList([]);
      }

      stringified = queryString.stringify({
        my_queues: true,
        page: 1,
        page_size: 5000,
      });

      const { data: myQueues } = await queuesAPI.fetchQueues(stringified);

      if (size(myQueues.data.result) > 0) {
        const list = myQueues.data.result.map((o: any) => ({
          label: o.name,
          value: o.id,
        }));

        setMyQueues(list);
      } else {
        setMyQueues([]);
      }
    } catch (error) {
      console.error("fetchCurrentUserQueues error =>", error);
    } finally {
      setIsLoading(false);
    }
  };
  const page = parseInt(queryParams.get("page") || "0") - 1;

  useEffect(() => {
    fetchCurrentEntityQueues();
  }, []);

  return (
    <Layout title={<p>{translate("questions.title")}</p>}>
      {!isLoading && (
        <Questions
          currentEntityQueuesList={currentEntityQueuesList}
          myQueues={myQueues}
          page={page < 0 ? 0 : page}
        />
      )}
    </Layout>
  );
};

export default index;
