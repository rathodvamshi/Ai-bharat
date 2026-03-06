"use client";

import ProfileScreen from "../../components/ProfileScreen";
import { useNavigation } from "../../contexts/NavigationContext";
import { useAuth } from "../../contexts/AuthContext";

export default function ProfilePage() {
  const { language, setLanguage } = useNavigation();
  const { user, logout } = useAuth();

  return (
    <ProfileScreen
      lang={language}
      onLangChange={setLanguage}
    />
  );
}
