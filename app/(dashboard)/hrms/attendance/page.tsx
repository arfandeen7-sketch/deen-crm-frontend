import { redirect } from "next/navigation";

export default function AttendanceRootPage() {
  redirect("/hrms/attendance/today");
}
