import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PageLayout } from './components/PageLayout';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { SpotDetails } from './pages/SpotDetails';
import { AddPlace } from './pages/AddPlace';
import { SuggestUpdate } from './pages/SuggestUpdate';
import { ReportInfo } from './pages/ReportInfo';
import { SavedSpots } from './pages/SavedSpots';
import { AdminDashboard } from './pages/AdminDashboard';
import { MyAccount } from './pages/MyAccount';
import { Today } from './pages/Today';
import { Upcoming } from './pages/Upcoming';
import { SignIn } from './pages/SignIn';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <PageLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/spot/:id" element={<SpotDetails />} />
          <Route path="/add" element={<AddPlace />} />
          <Route path="/suggest-update" element={<SuggestUpdate />} />
          <Route path="/report" element={<ReportInfo />} />
          <Route path="/today" element={<Today />} />
          <Route path="/upcoming" element={<Upcoming />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/saved" element={<SavedSpots />} />

          {/* Protected Routes for Authenticated Users */}
          <Route element={<ProtectedRoute requireAdmin={false} />}>
            <Route path="/account" element={<MyAccount />} />
          </Route>

          {/* Protected Routes for Admins */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </PageLayout>
    </Router>
  );
}

export default App;
