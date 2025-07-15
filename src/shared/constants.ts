import { forEach, uniq } from "lodash-es";
import moment from "moment";
import allImgPaths from "../assets";

export const USER = {
  name: "sender",
  id: localStorage.getItem("user_id") ?? "66f67f4c781474235959aaf4", // remove hardcoded here
  profile: allImgPaths.userIcon,
};

export const SITE_LANGUAGES = [
  { id: "en", name: "English", key: "english" },
  { id: "es", name: "Spanish", key: "spanish" },
  { id: "hi", name: "Hindi", key: "hindi" },
  { id: "fr", name: "French", key: "french" },
];

export const DATE_FORMATS = [
  {
    id: "Do MMM, YYYY",
    name: "Do MMM, YYYY (Default)",
    example: "28 Mar, 2025",
  },
  { id: "MMM DD, YYYY", name: "MMM DD, YYYY", example: "Mar 28, 2025" },
  {
    id: "ddd, MMMM DD, YYYY",
    name: "ddd, MMMM DD, YYYY",
    example: "Fri, March 28, 2025",
  },
  {
    id: "DD MMM YYYY, HH:mm",
    name: "DD MMM YYYY, HH:mm",
    example: "08 Apr 2025, 14:00",
  },
  {
    id: "YYYY-MM-DD HH:mm",
    name: "YYYY-MM-DD HH:mm",
    example: "2025-03-28 14:30",
  },
  {
    id: "MM/DD/YYYY HH:mm",
    name: "MM/DD/YYYY HH:mm",
    example: "03/28/2025 14:30",
  },
  {
    id: "DD/MM/YYYY HH:mm",
    name: "DD/MM/YYYY HH:mm",
    example: "28/03/2025 14:30",
  },
];

export const VOTE = {
  DOWN: "DOWN",
  UP: "UP",
};

export const PAGE_LIMIT = 10;

export const LANGUAGES = [
  { label: "ENGLISH", value: "en" },
  { label: "SPANISH", value: "es" },
  { label: "HINDI", value: "hi" },
];

export const FILE_UPLOAD_STATUS = {
  COMPLETED: "COMPLETED",
  IN_PROGRESS: "IN_PROGRESS",
  PENDING: "PENDING",
  ERROR: "ERROR",
  DELETED: "DELETED",
};
export const PRIORITIES = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
];

export const QUESTION_STATUS = [
  { value: "Open", label: "Open" },
  { value: "Ignored", label: "Ignored" },
  { value: "Closed", label: "Closed" },
];

export const HOST = {
  KNOWLEDGE_ENTRIES: import.meta.env.VITE_KNOWLEDGE_ENTRIES_HOST_URL,
  USERS: import.meta.env.VITE_USERS_HOST_URL,
  AUTH: import.meta.env.VITE_AUTH_HOST_URL,
  QUEUES: import.meta.env.VITE_QUEUES_HOST_URL,
  QUESTIONS: import.meta.env.VITE_QUESTIONS_HOST_URL,
  CONVERSATIONS: import.meta.env.VITE_CONVERSATIONS_HOST_URL,
  CONVERSATION_MESSAGES: import.meta.env.VITE_CONVERSATION_MESSAGES_HOST_URL,
  DOCUMENT_PROCESSING_HOST_URL: import.meta.env
    .VITE_DOCUMENT_PROCESSING_HOST_URL,
  CHAT: import.meta.env.VITE_CHATS_HOST_URL,
  DASHBOARD: import.meta.env.VITE_DASHBOARD_HOST_URL,
  CELERY_WORKER_AS_SERVICE: import.meta.env.VITE_CELERY_WORKER_AS_SERVICE,
  VP_PROVIDER: import.meta.env.VITE_VP_PROVIDER ?? "AzureAD",
  DEPLOYMENT_TYPE: import.meta.env.VITE_DEPLOYMENT_TYPE,
  CENTRAL_CLOUD_FUNCTIONS_URL: import.meta.env.VITE_CENTRAL_CLOUD_FUNCTIONS_URL,
};
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
export const APP_VERSION = import.meta.env.VITE_APP_VERSION;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,

  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

export const LOADING_ROWS = 10;
export const TOKEN_KEY_NAME = "jwt_auth_token";
export const EMPTY_CELL = "-";
export const ALLOWED_DOCUMENTS_FILES = {
  INPUT:
    ".html,.txt,.pdf,.docx,.doc.jpg,.jpeg,.png,.webp,.pptx,.xlsx,.xls,.mov,.mp4,.mkv,.webm,.avi,.wmv,.flv,.mpg,.mpeg,.mts,.m2ts",
  DROPZONE: {
    "text/html": [".html"],
    "text/plain": [".txt"],
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
      ".doc",
    ],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      [".pptx"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
      ".xls",
    ],
    "image/jpeg": [".jpeg", ".jpg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "video/quicktime": [".mov"],
    "video/mp4": [".mp4"],
    "video/x-matroska": [".mkv"],
    "video/webm": [".webm"],
    "video/x-msvideo": [".avi"],
    "video/x-ms-wmv": [".wmv"],
    "video/x-flv": [".flv"],
    "video/mpeg": [".mpg", ".mpeg"],
    "video/mp2t": [".mts", ".m2ts"],
  },
};

export const QUEUE_REROUTE_LIMIT = 2;

export const MAX_FILE_UPLOADS = {
  SINGLE: 8,
  BULK: 50,
};

export const MAX_FILE_UPLOADS_SIZE_LIMIT = {
  SINGLE: 150 * 1024 * 1024, // 150MB
  BULK: 150 * 1024 * 1024, // 150MB
};

export const IDLE_TIMEOUT = (window as any).IDLE_TIMEOUT || 1000 * 60 * 15; // 15 minutes in milliseconds
export const HEART_BEAT_TIME = { KE: 1000 * 60 * 1 }; // 1 minute in milliseconds
// export const DRAFT_KE_TIME = 1000 * 10; //  5 seconds in milliseconds
export const DRAFT_KE_TIME = (window as any).DRAFT_KE_TIME || 1000 * 60 * 1; //  1 minute in milliseconds

export const TABLE = {
  FILTER: {
    SELECT: "select",
    MULTISELECT: "multiselect",
    TEXT: "text",
    DATE: "date",
    MULTI_LEVEL_SELECT: "multi_level_select",
  },
};

export const ACCESS_ROLE = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export const MODULE_TYPE = {
  KE_EDITOR: "ke_editor",
  KE_VIEWER: "ke_viewer",
  QUEUE: "QUEUE",
};

export enum PAGES {
  USERS = "USERS",
  GROUPS = "GROUPS",
  ROLES = "ROLES",
  KNOWLEDGE_ENTRIES = "KNOWLEDGE_ENTRIES",
  QUEUES = "QUEUES",
  QUESTIONS = "QUESTIONS",
  CONVERSATIONS = "CONVERSATIONS",
  CHAT = "CHAT",
  DASHBOARD = "DASHBOARD",
  CONFIGURATION = "CONFIGURATION",
  PLAN_PRICING = "PLAN_PRICING",
}

export const SAVE_MODE = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  PROCESSING: "PROCESSING",
};

export const COUNTRIES = [
  { id: 1, name: "India" },
  { id: 2, name: "Brazil" },
  { id: 3, name: "USA" },
  { id: 4, name: "Russia" },
];
export const FACILITIES = [
  { id: 1, name: "Main Office" },
  { id: 2, name: "Warehouse A" },
  { id: 3, name: "Production Plant" },
  { id: 4, name: "Customer Service" },
  { id: 5, name: "Regional Office" },
  { id: 6, name: "Distribution Hub" },
];

export const DURATION_OPTIONS = [
  { id: 1, name: "By Month", key: "byMonth" },
  { id: 2, name: "By Week", key: "byWeek" },
];

export const CUSTOM_ATTRIBUTE_FIELD_TYPE = [
  { value: "TEXT_FIELD", label: "TEXT FIELD" },
  { value: "BOOLEAN_FIELD", label: "BOOLEAN" },
];

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  QUEUES_SUPPORT: "QUEUES_SUPPORT",
  CHATTER: "CHATTER",
};

export const ONBOARDING_STEPS = [
  "create_company",
  "invite_users",
  "set_preferences",
];

export const ACTION = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  READ: "READ",
};

export const MENUS = [
  {
    key: "chats",
    url: "/chats",
    icon: allImgPaths.chats,
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.QUEUES_SUPPORT,
      ROLES.CHATTER,
    ],
  },
  {
    key: "popularChats",
    url: "/popular-chats",
    icon: allImgPaths.popularChats,
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.QUEUES_SUPPORT,
      ROLES.CHATTER,
    ],
    isIgnoreInMainMenu: true,
  },
  {
    key: "questions",
    url: "/questions",
    icon: allImgPaths.questionDark,
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.QUEUES_SUPPORT],
  },
  {
    key: "queues",
    url: "/queues",
    icon: allImgPaths.queues,
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.QUEUES_SUPPORT],
  },
  {
    key: "admin-queues",
    url: "/admin/queues",
    icon: allImgPaths.queues,
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.QUEUES_SUPPORT],
  },
  {
    key: "KEs",
    url: "/KEs",
    icon: allImgPaths.KE,
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.QUEUES_SUPPORT,
      ROLES.CHATTER,
    ],
  },
  {
    key: "dashboard",
    url: "/admin/dashboard",
    icon: allImgPaths.dashboard,
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.QUEUES_SUPPORT],
  },
  {
    key: "users",
    url: "/admin/users",
    icon: allImgPaths.userDark,
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    key: "roles",
    url: "/admin/roles",
    icon: allImgPaths.roleIcon,
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    key: "configuration",
    url: "/admin/configuration",
    icon: allImgPaths.config,
    allowedRoles: [ROLES.SUPER_ADMIN],
  },
  {
    key: "plansBilling",
    url: "/admin/plans-billing",
    icon: allImgPaths.plans,
    // TODO: Remove this condition when billing is enabled for all environments
    allowedRoles:
      window.location.hostname.includes("qa") ||
      window.location.hostname.includes("localhost")
        ? [ROLES.SUPER_ADMIN, ROLES.ADMIN]
        : [],
  },
];

type RolesAccess = Record<string, string[]>;

const _ROLES_ACCESS: RolesAccess = {};

// Build ROLES_ACCESS
forEach(MENUS, (menu) => {
  forEach(menu.allowedRoles, (role) => {
    // Initialize the role array if not present
    if (!_ROLES_ACCESS[role]) {
      _ROLES_ACCESS[role] = [];
    }
    // Add the menu URL to the role's access list
    _ROLES_ACCESS[role].push(menu.url);
  });
});

forEach(_ROLES_ACCESS, (urls, role) => {
  _ROLES_ACCESS[role] = uniq(["/", ...urls]);
});

export const ROLES_ACCESS = _ROLES_ACCESS;

export const PROVIDER = {
  AzureAD: "AzureAD",
  GOOGLE: "Google",
};

export const fileIconMapper: any = {
  "application/msword": allImgPaths.docx,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    allImgPaths.docx,
  "application/pdf": allImgPaths.pdf,
  "text/html": allImgPaths.html,
  "text/plain": allImgPaths.txt,
  "image/jpeg": allImgPaths.jpeg,
  "image/jpg": allImgPaths.jpeg,
  "image/png": allImgPaths.png,
  "video/mp4": allImgPaths.videoIcon,
  "video/mkv": allImgPaths.videoIcon,
  "video/mov": allImgPaths.videoIcon,
  "video/webm": allImgPaths.videoIcon,
  "video/x-msvideo": allImgPaths.videoIcon,
  "video/x-ms-wmv": allImgPaths.videoIcon,
  "video/x-flv": allImgPaths.videoIcon,
  "video/mpeg": allImgPaths.videoIcon,
  "video/mp2t": allImgPaths.videoIcon,
  "video/hevc": allImgPaths.videoIcon,
};

export const QUESTIONS_FILTER_OPTIONS = [
  {
    name: "My Question",
    key: "myQuestions",
    id: 0,
  },
  {
    name: "All Question",
    key: "allQuestions",
    id: 1,
  },
];

export const QUEUES_FILTER_OPTIONS = [
  {
    name: "My Queues",
    key: "myQueues",
    id: 0,
  },
  {
    name: "All Queues",
    key: "allQueues",
    id: 1,
  },
];

export const FORM_LINK = "https://forms.gle/5sZVzzfA4Vzr7zof8";

export const ACCURACY_LEVEL = {
  MOST_RELEVANT: "MOST_RELEVANT",
  RELEVANT: "RELEVANT",
  MAY_BE_RELEVANT: "MAY_BE_RELEVANT",
  OTHERS: "OTHERS",
};

export const FILE_FORMATS_TOOLTIP_CONTENT = {
  documents: [
    {
      type: "PDF",
      desc: "Portable Document Format",
      extension: ["pdf"],
    },
    {
      type: "DOCX",
      desc: "Word Document",
      extension: ["docs"],
    },
    {
      type: "TXT",
      desc: "Plain Text File",
      extension: ["txt"],
    },
    {
      type: "HTML",
      desc: "Web Page File",
      extension: ["html"],
    },
    {
      type: "PPTX",
      desc: "PowerPoint Presentation",
      extension: ["pptx"],
    },
    {
      type: "XLSX",
      desc: "Excel Spreadsheet",
      extension: ["excel"],
    },
  ],
  images: [
    {
      type: "JPEG",
      desc: "Compressed Image",
      extension: ["jpeg", "jpg"],
    },
    {
      type: "PNG",
      desc: "High-quality Image",
      extension: ["png"],
    },
    {
      type: "WEBP",
      desc: "Modern Web Image",
      extension: ["webp"],
    },
  ],
  videos: [
    {
      type: "MP4",
      desc: "Standard Video Format",
      extension: ["mp4"],
    },
    {
      type: "MKV",
      desc: "Matroska Video",
      extension: ["mkv"],
    },
    {
      type: "MOV",
      desc: "Apple QuickTime Movie",
      extension: ["mov"],
    },
    {
      type: "WEBM",
      desc: "Web Optimized Video Format",
      extension: ["webm"],
    },
    {
      type: "AVI",
      desc: "Audio Video Interleave",
      extension: ["avi"],
    },
    {
      type: "WMV",
      desc: "Windows Media Video",
      extension: ["wmv"],
    },
    {
      type: "FLV",
      desc: "Flash Video Format",
      extension: ["flv"],
    },
    {
      type: "MPG/MPEG",
      desc: "Moving Picture Experts Group",
      extension: ["mpg", "mpeg"],
    },
    {
      type: "MTS/M2TS",
      desc: "MPEG Transport Stream",
      extension: ["mts", "m2ts"],
    },
  ],
};

export const FILE_ICONS: { [key: string]: string } = {
  pdf: allImgPaths.pdfIcon,
  html: allImgPaths.htmlIconBlue,
  txt: allImgPaths.textIcon,
  jpeg: allImgPaths.jpegIconBlue,
  jpg: allImgPaths.jpegIconBlue,
  png: allImgPaths.jpegIconBlue,
  webp: allImgPaths.jpegIconBlue,
  doc: allImgPaths.docIcon,
  docx: allImgPaths.docIcon,
  xls: allImgPaths.excelIcon,
  xlsx: allImgPaths.excelIcon,
  default: allImgPaths.docIcon,
  mp4: allImgPaths.videoIconBlue,
  mkv: allImgPaths.videoIconBlue,
  mov: allImgPaths.videoIconBlue,
  webm: allImgPaths.videoIconBlue,
  avi: allImgPaths.videoIconBlue,
};

// Chat filter options

export const CHAT_DATE_RANGE = [
  {
    label: "All Time",
    value: "all",
    startDate: "",
    endDate: "",
  },
  {
    label: "Today",
    value: "today",
    startDate: moment().startOf("day").toISOString(),
    endDate: moment().toISOString(),
  },
  {
    label: "This Week",
    value: "thisWeek",
    startDate: moment().startOf("week").toISOString(),
    endDate: moment().toISOString(),
  },
  {
    label: "This Month",
    value: "thisMonth",
    startDate: moment().startOf("month").toISOString(),
    endDate: moment().toISOString(),
  },
  {
    label: "3 Month Ago",
    value: "last3Months",
    startDate: moment().subtract(3, "months").toISOString(),
    endDate: moment().toISOString(),
  },
  {
    label: "This Year",
    value: "thisYear",
    startDate: moment().startOf("year").toISOString(),
    endDate: moment().toISOString(),
  },
  {
    label: "Custom",
    value: "custom",
    startDate: "",
    endDate: "",
  },
];

export const CHAT_FILE_TYPES = {
  "KE Description": [],
  ...Object.entries(FILE_FORMATS_TOOLTIP_CONTENT).reduce(
    (acc: any, [category, formats]) => {
      const label = category;
      if (!["images", "videos"].includes(label)) {
        acc[label] = formats.map((item) => item.extension.join(", "));
      } else {
        acc[label] = [];
      }
      return acc;
    },
    {},
  ),
};

export const CREDIT_PRICE = 1;
export const UNUSED_CREDIT_ROLLOVER_RATE = 0.42;

export const DEFAULT_ADMIN_URL = "/admin/dashboard";

export const topMenuItems = [
  {
    icon: allImgPaths.chatAddOn,
    label: "Start New Chat",
    action: "new-chat",
    url: "/chats?isNew=true",
    allowedRoles: [ROLES.QUEUES_SUPPORT, ROLES.CHATTER],
  },
  {
    icon: allImgPaths.searchChat,
    label: "Search Chats",
    action: "search",
    url: "/search",
    allowedRoles: [ROLES.QUEUES_SUPPORT, ROLES.CHATTER],
  },
  {
    icon: allImgPaths.question,
    label: "Questions",
    action: "questions",
    url: "/questions",
    allowedRoles: [ROLES.QUEUES_SUPPORT],
  },
  {
    icon: allImgPaths.chats,
    label: "Chats",
    action: "new-chat",
    url: "/chats",
    allowedRoles: [ROLES.QUEUES_SUPPORT],
  },
  {
    icon: allImgPaths.KE,
    label: "Library",
    action: "library",
    url: "/KEs",
    allowedRoles: [ROLES.QUEUES_SUPPORT, ROLES.CHATTER],
  },
  {
    icon: allImgPaths.dashboard,
    label: "Dashboard",
    action: "dashboard",
    url: "/admin/dashboard",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    icon: allImgPaths.queues,
    label: "Queues",
    action: "queues",
    url: "/admin/queues",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    icon: allImgPaths.userDark,
    label: "Users",
    action: "users",
    url: "/admin/users",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    icon: allImgPaths.roleIcon,
    label: "Roles",
    action: "roles",
    url: "/admin/roles",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    icon: allImgPaths.config,
    label: "Configuration",
    action: "configuration",
    url: "/admin/configuration",
    allowedRoles: [ROLES.SUPER_ADMIN],
  },
  {
    icon: allImgPaths.plans,
    label: "Plan & Pricing",
    action: "plan-pricing",
    url: "/admin/plans-billing",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
];

export const BOTTOM_MENU_ITEMS = [
  {
    icon: allImgPaths.adminPortal,
    label: "Go To User Portal",
    action: "switch-portal",
    url: "#",
    key: "switch-portal",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    icon: allImgPaths.queues,
    label: "Queues",
    action: "queues",
    url: "/queues",
    key: "queues",
    allowedRoles: [ROLES.QUEUES_SUPPORT],
  },
  // {
  //   icon: allImgPaths.popularChats,
  //   label: "Popular Questions",
  //   action: "popular-questions",
  //   url: "/popular-questions",
  //   allowedRoles: [ROLES.CHATTER, ROLES.QUEUES_SUPPORT],
  // },
];
