"use client";

import HistoryScreen from "../../components/HistoryScreen";
import { useNavigation } from "../../contexts/NavigationContext";

export default function HistoryPage() {
  const { language } = useNavigation();

  return <HistoryScreen lang={language} />;
}
