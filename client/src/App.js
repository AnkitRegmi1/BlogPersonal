import "./App.css";
import Layout from "./Layout";
import { Routes, Route } from "react-router-dom";
import IndexPage from "./pages/IndexPage";
import PostPage from "./pages/PostPage";
import AdminPage from "./pages/AdminPage";
import EditPost from "./pages/EditPost";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<IndexPage />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/edit/:id" element={<EditPost />} />
      </Route>
    </Routes>
  );
}

export default App;
