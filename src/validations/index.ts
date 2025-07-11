import { sanitizeCkEditorHtml } from "@/shared/functions";
import * as Yup from "yup";

export const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email")
    .required("Please enter your email"),
  password: Yup.string()
    .required("Please enter your password")
    .min(8, "Password field must be at least 8 characters long")
    .max(16, "Please enter maximum 16 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!+@#\\$%\\^&\\*])(?=.{8,})/,
      "Password field must contain at least 1 uppercase, 1 lowercase, 1 special character, and 1 number",
    ),
});

export const QuestionSchema = Yup.object().shape({
  question: Yup.string().required("Please enter a question"),
});

export const KE_CONTENT_LIMIT = 15000;
export const KE_TITLE_LIMIT = 500;

export const KEEntry = Yup.object().shape({
  title: Yup.string().trim().min(3).max(KE_TITLE_LIMIT).required(),
  content: Yup.string()
    .nullable()
    .optional()
    .test(
      "content-length",
      `Content must be at most ${KE_CONTENT_LIMIT} characters`,
      (value: any) => {
        // Ensure the value is a string and its length is within the range
        const sanitizedValue = sanitizeCkEditorHtml(value as string);
        return (
          sanitizedValue === null ||
          (sanitizedValue.length >= 0 &&
            sanitizedValue.length <= KE_CONTENT_LIMIT)
        );
      },
    ),
  currentUserAccess: Yup.string().optional(),
  question_id: Yup.string().nullable().optional(),
  users_access: Yup.array().optional(),
  documents: Yup.array().optional(),
  usersViewAccess: Yup.array().optional(),
  usersEditAccess: Yup.array().optional(),
  attributes_access: Yup.array().optional(),
  status: Yup.string().required(),
  keywords: Yup.array().min(0).max(15).optional(),
  language: Yup.object().nullable().optional(),
  view: Yup.object().nullable().optional(),
  edit: Yup.object().nullable().optional(),
  attributes: Yup.object().optional(),
  addMemberByType: Yup.string().required("Please select a member type"),
  users: Yup.array().optional(),
});

export const QueueSchema = Yup.object().shape({
  name: Yup.string().min(5).max(50).required("Please enter a name"),
  description: Yup.string()
    .min(5)
    .max(500)
    .required("Please enter a description"),
  keywords: Yup.array().min(0).max(15).required(),
  // languages: Yup.array()
  //   .min(1, "At least one language is required")
  //   .required("Please select at least one language"),
  assigned_users: Yup.array().optional(),
  // escalation_manager:Yup.array().optional(),
  //When an admin or super admin updates or create a record, no error should be raised for the orphaned queue if `assigned_users` or `escalation_manager` is empty.

  // assigned_users: Yup.array()
  //   .min(1, "Please assign at least one user")
  //   .of(
  // Yup.object()
  //   .shape({
  //     label: Yup.string().required("Label is required"),
  //     value: Yup.string().required("Value is required"),
  //     email: Yup.string().required("Email is required"),
  //   })
  //       .required("Please assign at least one user"),
  //   ),
  escalation_manager: Yup.object().nullable().optional(),
  aging_threshold: Yup.number()
    .max(30, "You can not set more than 30 days")
    .optional(),
});

export const GroupSchema = Yup.object().shape({
  name: Yup.string().min(5).max(50).required("Please enter a name"),
  description: Yup.string()
    .min(5)
    .max(500)
    .required("Please enter a description"),
  attributes: Yup.object().optional(),
  // attributes_access: Yup.array().optional(),
  // users_access: Yup.array().optional(),
  attributes_access: Yup.array()
    .optional()
    .test(
      "xxx",
      "Either attributes_access or users_access is required",
      function (value) {
        const { users_access } = this.parent;
        return (
          (value && value.length > 0) ||
          (users_access && users_access.length > 0)
        );
      },
    ),

  users_access: Yup.array()
    .optional()
    .test(
      "xxx",
      "Either Attributes Access or Users Access is required",
      function (value) {
        const { attributes_access } = this.parent;
        return (
          (value && value.length > 0) ||
          (attributes_access && attributes_access.length > 0)
        );
      },
    ),
});

export const RoleSchema = Yup.object().shape({
  name: Yup.string().min(5).max(50).required("Please enter a name"),
  description: Yup.string()
    .min(5)
    .max(200)
    .required("Please enter a description"),
  permissions: Yup.array().min(0).required("Permission required"),
});

export const ATTRIBUTE_DESCRIPTION_LIMIT = 500;
export const ConfigSchema = Yup.object().shape({
  name: Yup.string().min(3).max(50).required("Please enter a name"),
  description: Yup.string().min(0).max(ATTRIBUTE_DESCRIPTION_LIMIT).optional(),
  type: Yup.object().required(),
});

export const InviteFranchiseSchema = Yup.object().shape({
  entityName: Yup.string()
    .min(2, "Entity name must be at least 2 characters")
    .required("Entity name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  entityDescription: Yup.string().required("Description is required"),
});
