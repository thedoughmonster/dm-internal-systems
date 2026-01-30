import PackVerificationPanel from "./composites/PackVerificationPanel";

type PageProps = {
  params: { sessionId: string };
};

export default function PackVerificationPage({ params }: PageProps) {
  return (
    <div className="p-6">
      <PackVerificationPanel sessionId={params.sessionId} />
    </div>
  );
}
