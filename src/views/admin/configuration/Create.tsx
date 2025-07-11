import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

import allImgPaths from "@/assets";
import {
  ButtonV2,
  DrawerFooter,
  Input,
  Label,
  LoaderCircle,
  SelectComponent,
  Textarea,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { CUSTOM_ATTRIBUTE_FIELD_TYPE } from "@/shared/constants";
import { ATTRIBUTE_DESCRIPTION_LIMIT, ConfigSchema } from "@/validations";
import { get } from "lodash-es";
import { useEffect } from "react";

const Create = ({ onClose }: { onClose: () => void }) => {
  const location = useLocation();
  const { translate } = useTranslate();

  const {
    updateConfig,
    createAttribute,
    getConfigById,
    isFetching,
    isUpdating,
    isCreating,
  } = useAppState(RootState.CONFIGURATION);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      type: CUSTOM_ATTRIBUTE_FIELD_TYPE[0],
    },
    mode: "onChange",
    resolver: yupResolver(ConfigSchema),
  });

  const formValue = watch();

  const queryParams = new URLSearchParams(location.search);
  const attribute = queryParams.get("attribute") as string;

  const fetchConfig = async (id: string) => {
    try {
      const result = await getConfigById(id);

      setValue("name", result.name);
      setValue("description", result.description);
      setValue("type", { label: result.input_type, value: result.input_type });
    } catch (error) {
      console.error("error =>", error);
    }
  };

  useEffect(() => {
    if (attribute) fetchConfig(attribute).then(() => {});
  }, [attribute]);

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
      type: get(data, "type.value"),
    };

    try {
      if (attribute) {
        try {
          const { data } = await updateConfig(attribute, payload);

          toast.success(
            get(data, "result.message", "Config updated successfully"),
            {
              id: "success-config-updated",
            },
          );

          onClose();
        } catch (error) {
          const err = get(
            error,
            "response.data.errors",
            "Something went wrong, please try after sometime",
          );

          toast.error(err, {
            id: "error-config-update",
          });
        }
      } else {
        try {
          const data = await createAttribute(payload);

          toast.success(
            get(data, "result.message", "Config created successfully"),
            {
              id: "success-config-added",
            },
          );

          onClose();
        } catch (error) {
          const err = get(
            error,
            "response.data.errors",
            "Something went wrong, please try after sometime",
          );

          toast.error(err, {
            id: "error-config-added",
          });
        }
      }
    } catch (error) {
      const err = get(
        error,
        "response.data.errors.error",
        "Something went wrong, please try after sometime",
      );
      toast.error(err);
    }
  };

  if (isFetching)
    return (
      <div className="mt-80">
        <LoaderCircle />
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      autoComplete="off"
      className="flex relative flex-col justify-between w-full"
    >
      <div className="h-[calc(100vh_-_158px)] overflow-auto flex flex-col">
        <div className="flex flex-col gap-y-4 p-8 w-full rounded-2xl">
          <div className="flex flex-col gap-y-2 grow">
            <Label required>{translate("admin.config.form.name")}</Label>
            <div>
              <Input
                name="name"
                placeholder={translate("admin.config.form.namePlaceholder")}
                className="w-full"
                control={control}
                errors={errors}
              />
            </div>
          </div>
          <div className="flex">
            <div className="flex flex-col gap-y-2 grow">
              <Label>{translate("admin.config.form.description")}</Label>
              <div>
                <Textarea
                  name="description"
                  control={control}
                  rows={4}
                  type="textarea"
                  placeholder={translate(
                    "admin.config.form.descriptionPlaceholder",
                  )}
                  errors={errors}
                  maxChar={ATTRIBUTE_DESCRIPTION_LIMIT}
                />
              </div>
            </div>
          </div>
          <div className="flex">
            <div className="flex flex-col gap-y-2 grow">
              <Label required>{translate("admin.config.form.type")}</Label>
              <div>
                <SelectComponent
                  value={formValue.type}
                  name="type"
                  placeholder={translate("admin.config.form.typePlaceholder")}
                  options={CUSTOM_ATTRIBUTE_FIELD_TYPE}
                  closeMenuOnSelect={true}
                  onChange={(data: any) => {
                    setValue("type", data, {
                      shouldValidate: true,
                    });
                  }}
                  errors={errors}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <DrawerFooter>
        <div className="flex justify-end w-full">
          <ButtonV2
            type="submit"
            className="min-w-36"
            color="primary"
            loading={isUpdating || isCreating}
            rightIcon={allImgPaths.rightArrow}
          >
            {attribute
              ? translate("common.update")
              : translate("common.create")}
          </ButtonV2>
        </div>
      </DrawerFooter>
    </form>
  );
};

export default Create;
