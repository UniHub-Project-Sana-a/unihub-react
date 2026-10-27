export const COLLEGE_DASHBOARD_PERMISSIONS = [
  "dashboard.view_college",
  "study_plan.view",
  "locations.view",
  "academic_titles.view",
  "staff.view",
  "timetable.view_lectures",
  "groups.view",
  "periods.view",
  "reports.view_custom",
  "requests.view_makeup",
];

const COLLEGE_PERMISSION_ROUTES = [
  { permission: "users.view", path: "/users" },
  { permission: "timetable.view_lectures", path: "/timetable" },
  { permission: "groups.view", path: "/enrollment" },
  { permission: "requests.view_makeup", path: "/excuses" },
  { permission: "staff.view", path: "/academic-staff" },
];

export function canAccessCollegePath(
  path: string,
  collegeId: number | string,
  permissions: string[]
): boolean {
  const dashboardPath = `/colleges/${collegeId}/dashboard`;
  if (path === dashboardPath) {
    return permissions.some((permission) => COLLEGE_DASHBOARD_PERMISSIONS.includes(permission));
  }

  return COLLEGE_PERMISSION_ROUTES.some(
    ({ permission, path: routePath }) =>
      (path === routePath || path.startsWith(`${routePath}/`)) && permissions.includes(permission)
  );
}

export function getCollegeLandingPath(
  collegeId: number | string,
  permissions: string[]
): string {
  if (permissions.some((permission) => COLLEGE_DASHBOARD_PERMISSIONS.includes(permission))) {
    return `/colleges/${collegeId}/dashboard`;
  }

  return COLLEGE_PERMISSION_ROUTES.find(({ permission }) => permissions.includes(permission))?.path
    ?? `/colleges/${collegeId}/dashboard`;
}
