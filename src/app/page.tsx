import { SearchExperience } from "@/components/search/SearchExperience";
import { LISTINGS } from "@/lib/listings";

export default function Home() {
  return <SearchExperience listingCount={LISTINGS.length} />;
}
