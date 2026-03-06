"use client";

import VoiceAssistantScreen from "../../components/VoiceAssistantScreen";
import { useNavigation } from "../../contexts/NavigationContext";

export default function VoicePage() {
  const { language } = useNavigation();

  return <VoiceAssistantScreen lang={language} />;
}
