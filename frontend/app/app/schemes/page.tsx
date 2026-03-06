"use client";

import SchemesScreen from "../../components/SchemesScreen";
import { useNavigation } from "../../contexts/NavigationContext";

export default function SchemesPage() {
  const { language } = useNavigation();

  return <SchemesScreen lang={language} />;
}
