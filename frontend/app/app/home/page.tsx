"use client";

import HomeScreen from "../../components/HomeScreen";
import { useNavigation } from "../../contexts/NavigationContext";
import { useAuth } from "../../contexts/AuthContext";

export default function HomePage() {
  const { language, setLanguage, navigateTo } = useNavigation();
  const { user } = useAuth();

  const handleToolClick = (tool: string) => {
    if (tool === "ai") navigateTo("voice");
    else if (tool === "weather") navigateTo("home");
    else if (tool === "schemes") navigateTo("schemes");
  };

  return (
    <HomeScreen
      phone={user?.phone || ""}
      lang={language}
      onToolClick={handleToolClick}
      onLangChange={setLanguage}
    />
  );
}
