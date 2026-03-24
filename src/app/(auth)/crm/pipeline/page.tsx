import type { Metadata } from "next";
import { PipelineBoard } from "@/components/crm/pipeline-board";

export const metadata: Metadata = { title: "Pipeline CRM" };

export default function PipelinePage() {
  return <PipelineBoard />;
}
