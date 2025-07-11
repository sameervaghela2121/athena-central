import allImgPaths from "@/assets";

import { ButtonV2, Modal, SelectComponent } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { filter, map } from "lodash-es";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const AssignGroupsModal = ({
  onClose,
  userId,
  show,
}: {
  onClose: () => void;
  userId: string;
  show: boolean;
}) => {
  if (!show) return;

  const { translate } = useTranslate();

  const { data, getGroups, isLoading } = useAppState(RootState.GROUPS);
  const { updateUser, getUser, isUpdating } = useAppState(RootState.USERS);

  const [selectedGroups, setSelectedGroups] = useState([]);

  useEffect(() => {
    getGroups().then(async (resp) => {
      const result = await getUser(userId);
      const existingGroupsIds = map(result.groups, "id");

      const existingGroups: any = filter(resp, (item) =>
        existingGroupsIds.includes(item.id),
      ).map((o) => ({ value: o.id, label: o.name }));

      setSelectedGroups(existingGroups);
    });
  }, [userId]);

  const assignGroups = async () => {
    const payload = {
      groups: map(selectedGroups, "value"),
    };

    try {
      await updateUser(userId, payload);
      toast.success(`Groups assigned successfully`);
      onClose();
    } catch (error) {
      toast.error("Something went wrong, please try again later");
    }
  };

  const options: { value: string; label: string }[] = useMemo(
    () =>
      data.map((o) => {
        return { value: o.id, label: o.name };
      }),
    [data],
  );

  return (
    <div>
      <Modal size="xl" show={show} onClose={onClose} backdrop={false}>
        <div className="flex flex-col gap-y-10">
          <div className="flex gap-y-3 flex-col">
            <div>
              <p className="font-medium text-lg capitalize">Assign Groups</p>
            </div>
            <div>
              <SelectComponent
                menuPortalTarget={document.body}
                isLoading={isLoading}
                value={selectedGroups}
                isMulti
                name="groups"
                placeholder={"Select Groups"}
                options={options}
                defaultOptions
                chipColor="#D9F0F9"
                onChange={(data: any) => {
                  setSelectedGroups(data);
                }}
              />
            </div>
          </div>
          <div className="flex justify-center gap-x-5">
            <div>
              <ButtonV2 onClick={onClose} variant="tertiaryDark">
                {translate("common.cancel")}
              </ButtonV2>
            </div>
            <div>
              <ButtonV2
                loading={isUpdating}
                onClick={assignGroups}
                variant="primary"
                rightIcon={allImgPaths.rightArrow}
              >
                {translate("common.submit")}
              </ButtonV2>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignGroupsModal;
