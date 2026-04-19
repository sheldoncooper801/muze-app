import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";
import PlayerProvider from "@/components/PlayerProvider";
import NowPlayingModal from "@/components/NowPlayingModal";
import QueueSidebar from "@/components/QueueSidebar";
import { AuthProvider } from "@/context/AuthContext";
import HomePage from "@/pages/HomePage";
import StorePage from "@/pages/StorePage";
import PlaylistsPage from "@/pages/PlaylistsPage";
import MarketingPage from "@/pages/MarketingPage";
import CheckoutPage from "@/pages/CheckoutPage";
import EarningsPage from "@/pages/EarningsPage";
import AIMoodDJ from "@/pages/AIMoodDJ";
import FanTipPage from "@/pages/FanTipPage";
import ListeningParty from "@/pages/ListeningParty";
import EqualizerPage from "@/pages/EqualizerPage";
import SmartPlaylists from "@/pages/SmartPlaylists";
import LyricsSearch from "@/pages/LyricsSearch";
import MuzeWrapped from "@/pages/MuzeWrapped";
import EventsPage from "@/pages/EventsPage";
import RegisterPage from "@/pages/RegisterPage";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/not-found";

const AUTH_PATHS = ["/register", "/login", "/forgot-password", "/reset-password", "/verify-email"];

// Inner component so it can use wouter hooks inside the Router
function AppInner() {
  const [location] = useLocation();
  // Normalize: ensure leading slash, strip query string
  const normalizedLoc = "/" + location.replace(/^\//, "").split("?")[0];
  const isAuthPage = AUTH_PATHS.some(p => normalizedLoc.startsWith(p));

  if (isAuthPage) {
    return (
      <Switch>
        <Route path="/register" component={RegisterPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/verify-email" component={VerifyEmailPage} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/store" component={StorePage} />
        <Route path="/playlists" component={PlaylistsPage} />
        <Route path="/smart-playlists" component={SmartPlaylists} />
        <Route path="/marketing" component={MarketingPage} />
        <Route path="/mood-dj" component={AIMoodDJ} />
        <Route path="/tip" component={FanTipPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/earnings" component={EarningsPage} />
        <Route path="/party" component={ListeningParty} />
        <Route path="/equalizer" component={EqualizerPage} />
        <Route path="/lyrics-search" component={LyricsSearch} />
        <Route path="/wrapped" component={MuzeWrapped} />
        <Route path="/events" component={EventsPage} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PlayerProvider>
          <Router hook={useHashLocation}>
            <AppInner />
            <NowPlayingModal />
            <QueueSidebar />
          </Router>
          <Toaster />
        </PlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
