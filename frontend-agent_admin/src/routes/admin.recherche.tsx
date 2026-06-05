import { createFileRoute } from "@tanstack/react-router";
import { RecherchePage } from "./agent.recherche";

export const Route = createFileRoute("/admin/recherche")({
  component: RecherchePage,
});
