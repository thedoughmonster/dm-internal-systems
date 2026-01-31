import PackVerificationView from "./composites/PackVerificationView";

type PageProps = {
  params: { sessionId: string };
};

export default function PackVerificationPage({ params }: PageProps) {
  return <PackVerificationView sessionId={params.sessionId} />;
}
