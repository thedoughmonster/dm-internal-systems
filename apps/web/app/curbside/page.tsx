import type { Metadata } from "next";
import CheckinClient from "./CheckinClient";
import styles from "./curbside.module.css";

const title = "Dough Monster Curbside Check-In";
const description =
  "Tap to let us know you've arrived. We'll bring your order right out.";
const imageUrl = "https://doh.monster/og/curbside.png";
const baseUrl = "https://doh.monster/curbside";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}): Promise<Metadata> {
  const resolved = await searchParams;
  const checkin =
    typeof resolved?.checkin === "string" ? resolved.checkin : "";
  const canonicalUrl = new URL(baseUrl);
  if (checkin) {
    canonicalUrl.searchParams.set("checkin", checkin);
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl.toString(),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl.toString(),
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function CurbsidePage() {
  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>Curbside Check-In</h1>
          <p className={styles.text}>
            Tap when you arrive and we'll bring your order right out.
          </p>
          <CheckinClient />
        </div>
      </div>
    </div>
  );
}
