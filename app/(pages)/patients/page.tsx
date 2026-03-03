import { redirect } from "next/navigation";

export default function DoctorRootRedirect() {
  redirect("/patients/home");
}