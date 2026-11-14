import { notFound } from "next/navigation";
import FieldPlate from "@/components/FieldPlate";
import { getLocation, LOCATIONS } from "@/lib/locations";

export function generateStaticParams() {
  return LOCATIONS.map((l) => ({ slug: l.slug }));
}

export default function FieldPage({ params }: { params: { slug: string } }) {
  const loc = getLocation(params.slug);
  if (!loc) notFound();
  return <FieldPlate loc={loc} />;
}
