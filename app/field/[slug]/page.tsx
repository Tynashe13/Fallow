import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Plate from "@/components/plate/Plate";
import { BlockArt } from "@/components/plate/BlockFigure";
import { getLocation, LOCATIONS } from "@/lib/locations";

export function generateStaticParams() {
  return LOCATIONS.map((l) => ({ slug: l.slug }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const loc = getLocation(params.slug);
  return { title: loc ? `${loc.name} field profile` : "Field profile" };
}

export default function FieldPage({ params }: { params: { slug: string } }) {
  const loc = getLocation(params.slug);
  if (!loc) notFound();
  return (
    <div className="field">
      <main id="main-content" tabIndex={-1} className="field-main">
        <div className="stage-wrap">
          <div className="stage">
            <Plate site={loc.slug} view={<BlockArt site={loc.slug} />} />
          </div>
        </div>
      </main>
    </div>
  );
}
