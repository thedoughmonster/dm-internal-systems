import { redirect } from "next/navigation";

type PageProps = {
  params: { sessionId: string };
};

export default function PackVerificationPage({ params }: PageProps) {
  redirect(`/vendors/ingest/sessions/${params.sessionId}`);
}
