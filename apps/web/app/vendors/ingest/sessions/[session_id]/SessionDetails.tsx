type SessionRecord = {
  id: string;
  created_at: string;
  vendor_id: string;
  handler_id: string;
  filename: string | null;
  proposed: object;
  confirm_meta: object;
  write_summary: object;
  audit: object;
  vendor_invoice_id: string | null;
};

function renderJson(value: object) {
  return JSON.stringify(value, null, 2);
}

export default function SessionDetails({
  session,
}: {
  session: SessionRecord;
}) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-slate-900">
        Vendor Ingest Session
      </h1>
      <div className="mt-4 grid gap-3 text-sm text-slate-700">
        <div>
          <span className="font-semibold text-slate-900">Session ID:</span>{" "}
          {session.id}
        </div>
        <div>
          <span className="font-semibold text-slate-900">Created:</span>{" "}
          {session.created_at}
        </div>
        <div>
          <span className="font-semibold text-slate-900">Vendor ID:</span>{" "}
          {session.vendor_id}
        </div>
        <div>
          <span className="font-semibold text-slate-900">Handler ID:</span>{" "}
          {session.handler_id}
        </div>
        <div>
          <span className="font-semibold text-slate-900">Filename:</span>{" "}
          {session.filename ?? "n/a"}
        </div>
        <div>
          <span className="font-semibold text-slate-900">
            Vendor Invoice ID:
          </span>{" "}
          {session.vendor_invoice_id ?? "n/a"}
        </div>
      </div>
      <div className="mt-6 space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-slate-900">Proposed</h2>
          <pre className="mt-2 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
            {renderJson(session.proposed)}
          </pre>
        </section>
        <section>
          <h2 className="text-sm font-semibold text-slate-900">Confirm Meta</h2>
          <pre className="mt-2 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
            {renderJson(session.confirm_meta)}
          </pre>
        </section>
        <section>
          <h2 className="text-sm font-semibold text-slate-900">Write Summary</h2>
          <pre className="mt-2 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
            {renderJson(session.write_summary)}
          </pre>
        </section>
        <section>
          <h2 className="text-sm font-semibold text-slate-900">Audit</h2>
          <pre className="mt-2 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
            {renderJson(session.audit)}
          </pre>
        </section>
      </div>
    </div>
  );
}
