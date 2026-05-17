import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ParentRoute } from "./components/ParentRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AddQuestionPage } from "./pages/AddQuestionPage";
import { AISettingsPage } from "./pages/AISettingsPage";
import { ChildrenPage } from "./pages/ChildrenPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PracticePage } from "./pages/PracticePage";
import { PracticeSetupPage } from "./pages/PracticeSetupPage";
import { QuestionBankPage } from "./pages/QuestionBankPage";
import { ReviewAIResultPage } from "./pages/ReviewAIResultPage";
import { StatsPage } from "./pages/StatsPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route
          path="children"
          element={
            <ParentRoute>
              <ChildrenPage />
            </ParentRoute>
          }
        />
        <Route
          path="ai-settings"
          element={
            <ParentRoute>
              <AISettingsPage />
            </ParentRoute>
          }
        />
        <Route
          path="add-question"
          element={
            <ParentRoute>
              <AddQuestionPage />
            </ParentRoute>
          }
        />
        <Route
          path="review-ai-result"
          element={
            <ParentRoute>
              <ReviewAIResultPage />
            </ParentRoute>
          }
        />
        <Route
          path="question-bank"
          element={
            <ParentRoute>
              <QuestionBankPage />
            </ParentRoute>
          }
        />
        <Route path="practice-setup" element={<PracticeSetupPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="stats" element={<StatsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
