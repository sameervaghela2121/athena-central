import {
  filter,
  forEach,
  indexOf,
  orderBy,
  startCase,
  toLower,
} from "lodash-es";
import moment from "moment";
import sanitizeHtml from "sanitize-html";
import { twMerge } from "tailwind-merge";
import { ACCESS_ROLE, MENUS, ROLES, TOKEN_KEY_NAME } from "./constants";

//Function to merge all tailwind-classes
export const classes = (
  ...classLists: (string | null | undefined | false)[]
) => {
  return twMerge(
    ...classLists.map((classList) => (!classList ? null : classList)),
  );
};

export const formatNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
};

export const formatDate = (
  date: string | Date,
  format: string = "Do MMM, YYYY",
) => {
  if (!date) return "";
  const momentDate = moment(date);

  if (moment().diff(momentDate, "hours") < 24) {
    return momentDate.fromNow();
  }

  return momentDate.format(format);
};

export const formatSizeUnits = (x: string) => {
  const units = [
    "bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  let l = 0,
    n = parseInt(x, 10) || 0;

  while (n >= 1024 && ++l) {
    n = n / 1024;
  }

  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
};

export const getCookie = (name: string) => {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (cookie) {
    return cookie.split("=")[1];
  }

  return null;
};

export const setCookie = (name: string, value: any, days = 30) => {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
};
export const eraseCookie = (name: string) => {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
};

export const removeExtension = (filename: string) => {
  const index = filename.lastIndexOf(".");
  return index !== -1 ? filename.slice(0, index) : filename;
};

const HSLtoString = (hsl: any[]) => {
  return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
};

const getHashOfString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // tslint:disable-next-line: no-bitwise
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  return hash;
};

const normalizeHash = (hash: number, min: number, max: number) => {
  return Math.floor((hash % (max - min)) + min);
};

const generateHSL = (
  name: string,
  saturationRange: any[],
  lightnessRange: any[],
) => {
  const hash = getHashOfString(name);
  const h = normalizeHash(hash, 0, 360);
  const s = normalizeHash(hash, saturationRange[0], saturationRange[1]);
  const l = normalizeHash(hash, lightnessRange[0], lightnessRange[1]);
  return [h, s, l];
};

export const getRange = (value: number, range: number) => {
  return [Math.max(0, value - range), Math.min(value + range, 100)];
};
export const generateColorHsl = (name: string) => {
  const saturationRange = getRange(10, 40);
  const lightnessRange = getRange(10, 40);
  return HSLtoString(generateHSL(name, saturationRange, lightnessRange));
};

// Define a type for the grouped permissions
type GroupedPermissionObject = {
  key: string;
  permission: string[];
};

export const groupPermissionsByModule = (
  permissions: string[],
): GroupedPermissionObject[] => {
  const groupedPermissions: { [key: string]: string[] } = permissions.reduce(
    (acc, permission) => {
      // Split the permission into action and module
      const [action, module] = permission.split("_", 2);

      // Initialize the module array if it doesn't exist
      if (!acc[module]) {
        acc[module] = [];
      }

      // Add action to the appropriate module if it's not already there
      if (!acc[module].includes(action)) {
        acc[module].push(action);
      }

      return acc;
    },
    {} as { [key: string]: string[] },
  );

  // Convert the grouped permissions object into an array of objects
  return Object.keys(groupedPermissions).map((module) => ({
    key: module,
    permission: groupedPermissions[module],
  }));
};

// Define the filtering function based on role
export const filterPermissions = (role: string, PERMISSIONS_OPTIONS: any[]) => {
  let allowedRoles: string[];

  // Set allowed roles based on the current user's role
  switch (role) {
    case ACCESS_ROLE.OWNER:
      allowedRoles = [
        ACCESS_ROLE.OWNER,
        ACCESS_ROLE.EDITOR,
        ACCESS_ROLE.VIEWER,
      ];
      break;
    case ACCESS_ROLE.EDITOR:
      allowedRoles = [ACCESS_ROLE.EDITOR, ACCESS_ROLE.VIEWER];
      break;
    case ACCESS_ROLE.VIEWER:
      allowedRoles = [ACCESS_ROLE.VIEWER];
      break;
    default:
      allowedRoles = [];
  }

  // Use lodash's `filter` method to return only allowed permissions
  return filter(PERMISSIONS_OPTIONS, (option) =>
    allowedRoles.includes(option.id),
  );
};

export const orderArray = (
  users_access: any[],
  priorityIds: string[],
  key = "value",
) => {
  return orderBy(
    users_access,
    [
      (user) => {
        // Check if the user's value is in the priorityIds list
        const index = indexOf(priorityIds, user[key]);
        return index === -1 ? Infinity : index;
      },
      (user) => {
        // Second criterion: permissions order (Owner first, then Editor, then Viewer)
        const permissionsOrder: any = {
          [ACCESS_ROLE.OWNER]: 0,
          [ACCESS_ROLE.EDITOR]: 1,
          [ACCESS_ROLE.VIEWER]: 2,
        };
        return permissionsOrder[user.permissions.id] ?? 3;
      },
      "value", // Order by `value` after priority IDs
    ],
    ["asc", "asc"], // Ascending order for both criteria
  );
};

export const clearAllIntervals = () => {
  const interval_id = window.setInterval(
    function () {},
    Number.MAX_SAFE_INTEGER,
  );

  for (let i = 1; i < interval_id; i++) {
    // window.clearInterval(i);
  }
};

export const filterMenu = ({
  imposterRole,
  role,
}: {
  imposterRole: string;
  role: string;
}) => {
  const roleToBeFilter =
    (role === ROLES.ADMIN ? imposterRole : role) ?? ROLES.CHATTER;

  if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role)) {
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(imposterRole)) {
      return MENUS.filter(
        (menu) =>
          menu.allowedRoles.includes(roleToBeFilter) &&
          menu.url.includes("admin"),
        // || menu.url.includes("dashboard")
      );
    } else {
      return MENUS.filter(
        (menu) =>
          menu.allowedRoles.includes(role) &&
          (!menu.url.includes("admin") ||
            (imposterRole === ROLES.QUEUES_SUPPORT &&
              menu.url.includes("dashboard"))),
      );
    }
  } else {
    return MENUS.filter((menu) => menu.allowedRoles.includes(roleToBeFilter));
  }
};

export const renameRoleLabel = (originalString: string) => {
  const result = startCase(toLower(originalString.split("_").join(" ")));
  return result;
};

type Permission = "Owner" | "Editor" | "Viewer";

interface User {
  email: string;
  id: string;
  name: string;
  username: string;
}

interface DataEntry {
  permissions: Permission;
  user: User;
}

export const findHighestPermissionById = (
  data: DataEntry[],
  userId: string,
): Permission => {
  // Define priority of permissions
  const permissionPriority: Record<Permission, number> = {
    Owner: 3,
    Editor: 2,
    Viewer: 1,
  };

  // Filter entries for the given user ID
  const userPermissions = data
    .filter((entry) => entry.user.id === userId)
    .map((entry) => entry.permissions);

  // Find the highest priority permission
  const highestPermission = userPermissions.reduce<Permission>(
    (highest, current) => {
      return permissionPriority[current] > permissionPriority[highest]
        ? current
        : highest;
    },
    "Viewer",
  ); // Default to the lowest priority if no matches

  return highestPermission;
};

export const getToken = () => {
  const token =
    getCookie(TOKEN_KEY_NAME) || localStorage.getItem(TOKEN_KEY_NAME);

  return token;
};

export const groupByDate = (conversations: any) => {
  const today = moment().startOf("day"); // Today at midnight
  const yesterday = moment().subtract(1, "days").startOf("day");
  const sevenDaysAgo = moment().subtract(7, "days").startOf("day");
  const thirtyDaysAgo = moment().subtract(30, "days").startOf("day");

  const grouped: any = {
    today: [],
    yesterday: [],
    "previous 7 Days": [],
    "previous 30 Days": [],
    older: [],
  };

  forEach(conversations, (conversation) => {
    const createdAt = moment(conversation.created_at);

    if (createdAt.isSame(today, "day")) {
      grouped.today.push(conversation);
    } else if (createdAt.isSame(yesterday, "day")) {
      grouped.yesterday.push(conversation);
    } else if (createdAt.isAfter(sevenDaysAgo)) {
      grouped["previous 7 Days"].push(conversation);
    } else if (createdAt.isAfter(thirtyDaysAgo)) {
      grouped["previous 30 Days"].push(conversation);
    } else {
      grouped.older.push(conversation);
    }
  });

  return grouped;
};

export const sanitizeCkEditorHtml = (value: string) => {
  const output = sanitizeHtml(value, {
    allowedTags: [], // No tags allowed
    allowedAttributes: {}, // No attributes allowed
  });
  return output;
};

export const resetAllStorage = () => {
  localStorage.clear();

  const keys = [
    "jwt_auth_token",
    "user_email",
    "user_id",
    "user_name",
    "is_login",
    "session",
  ];

  keys.forEach((key) => {
    eraseCookie(key);
  });
};

export const formatSecondTime = (seconds: number) => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  }
};

export const download = (data: any, filename: string) => {
  // Create a temporary link element to trigger the download

  // Check if running in a mobile environment
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  if (isMobile) {
    // Mobile approach - use the Blob URL directly
    const url = window.URL.createObjectURL(new Blob([data]));

    // Open in a new tab which generally works better on mobile
    const newWindow = window.open(url, "_blank");

    // If popup blocked or not supported
    if (!newWindow) {
      // Fallback - try to use the same window
      window.location.href = url;

      // Clean up the URL object after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } else {
      // Clean up when the new window has loaded
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    }
  } else {
    // Desktop approach - more reliable
    const url = window.URL.createObjectURL(new Blob([data]));

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

const removeMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold (**text**)
    .replace(/\*(.*?)\*/g, "$1") // Italics (*text*)
    .replace(/`(.*?)`/g, "$1") // Inline code (`code`)
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links [text](url)
    .replace(/^\s*[-*+]\s+/gm, "") // Bullet points (*, -, +)
    .replace(/^#{1,6}\s*/gm, "") // Headings (#, ##, ###, etc.)
    .replace(/>\s?/g, "") // Blockquotes (>)
    .replace(/`{3}[\s\S]*?`{3}/g, "") // Code blocks (```code```)
    .replace(/\n{2,}/g, "\n") // Remove excessive newlines
    .trim();
};

/**
 * Highlights and trims text based on keywords
 * Trims all text before the matching words and adds ellipsis if text is trimmed
 * @param text - The text to process
 * @param keywords - Array of keywords to search for
 * @returns Trimmed text with matching words at the beginning
 */
export const highlightAndTrim = (text: string, keywords: any) => {
  // return entire string if length is less than 100 characters
  if (text.length < 100) return text;
  text = removeMarkdown(text);
  if (!Array.isArray(keywords) || keywords.length === 0) return text;

  // Create a combined search term by joining all keywords
  const searchTerm = keywords.filter(Boolean).join(" ").trim();
  if (!searchTerm) return text;

  // Find the match in the text (case insensitive)
  const lowerText = text.toLowerCase();
  const lowerSearchTerm = searchTerm.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerSearchTerm);

  // If exact phrase match found
  if (matchIndex !== -1) {
    // Trim all text before the match
    const trimmedText = text.substring(matchIndex);

    // Add ellipsis if text was trimmed (if matchIndex > 0)
    return matchIndex > 0 ? "..." + trimmedText : trimmedText;
  }

  // Try to find individual words if the exact phrase wasn't found
  let firstMatchIndex = -1;
  let matchedKeyword = "";

  // Find the first occurrence of any keyword
  for (let keyword of keywords) {
    if (!keyword) continue;
    const index = lowerText.indexOf(keyword.toLowerCase());
    if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
      firstMatchIndex = index;
      matchedKeyword = keyword;
    }
  }

  // If still no match, return original text
  if (firstMatchIndex === -1) return text;

  // Trim all text before the match
  const trimmedText = text.substring(firstMatchIndex);

  // Add ellipsis if text was trimmed (if firstMatchIndex > 0)
  return firstMatchIndex > 0 ? "..." + trimmedText : trimmedText;
};

export const convertISTRangeToUTC = (
  startDateIST: string,
  endDateIST: string,
) => {
  /**
   * Converts an IST date range (selected from the frontend) to a UTC date range.
   * @param {string} startDateIST - Start date in IST (format: 'YYYY-MM-DD')
   * @param {string} endDateIST - End date in IST (format: 'YYYY-MM-DD')
   * @return {Object} { startUTC, endUTC } in ISO format for backend API
   */

  const start = moment(startDateIST).startOf("day").format("YYYY-MM-DD");
  const end = moment(endDateIST).endOf("day").format("YYYY-MM-DD");

  // Convert IST to UTC (Start of the day in IST)
  const offsetDiff = new Date().getTimezoneOffset();

  const startIST = moment(`${start}T00:00:00`).utcOffset(offsetDiff);
  const startUTC = startIST.utc().format(); // Convert to UTC ISO string

  // Convert IST to UTC (End of the day in IST)
  const endIST = moment(`${end}T23:59:59`).utcOffset(offsetDiff);

  const endUTC = endIST.utc().format(); // Convert to UTC ISO string

  return { startDate: startUTC, endDate: endUTC };
};

export const timeToSeconds = (time: string) => {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

// Calculate percentage for progress bars
export const calculatePercentage = (used: number, total: number): number => {
  try {
    if (total === 0) return 0;
    return Math.min(Math.round((used / total) * 100), 100);
  } catch (error) {
    console.error("calculatePercentage Error:", error);
    return 0;
  }
};
