import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingDetail } from "@/components/listing/ListingDetail";
import { formatPrice } from "@/lib/format";
import { LISTINGS, getListing } from "@/lib/listings";
import type { Listing } from "@/lib/types";

export function generateStaticParams() {
  return LISTINGS.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/homes/[id]">): Promise<Metadata> {
  const l = getListing((await params).id);
  if (!l) return {};
  return { title: `${l.street}, ${l.city} · ${formatPrice(l.price)} · BetterImmo`, description: l.summary };
}

/** Up to three available homes in the same city or of the same type, closest in price first. */
function similarTo(l: Listing): Listing[] {
  return LISTINGS.filter((x) => x.id !== l.id && x.status === "available" && (x.city === l.city || x.type === l.type))
    .sort((a, b) => Number(b.city === l.city) - Number(a.city === l.city) || Math.abs(a.price - l.price) - Math.abs(b.price - l.price))
    .slice(0, 3);
}

export default async function HomePage({ params }: PageProps<"/homes/[id]">) {
  const listing = getListing((await params).id);
  if (!listing) notFound();
  return <ListingDetail listing={listing} similar={similarTo(listing)} />;
}
