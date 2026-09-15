import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { LandingPage } from "@/pages/LandingPage";
import { CatalogPage } from "@/pages/CatalogPage";
import { CoursePage } from "@/pages/CoursePage";
import { LessonPage } from "@/pages/LessonPage";
import { SearchPage } from "@/pages/SearchPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProPage } from "@/pages/ProPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/courses" element={<CatalogPage />} />
        <Route path="/courses/:courseId" element={<CoursePage />} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pro" element={<ProPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
