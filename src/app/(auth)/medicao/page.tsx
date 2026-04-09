import type { Metadata } from "next";
import { MedicaoContent } from "@/components/medicao/medicao-content";

export const metadata: Metadata = { title: "Medição | ConstruTech Pro" };

export default function MedicaoPage() {
  return <MedicaoContent />;
}
