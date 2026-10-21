import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import PageNotFound from './pages/index/404.jsx';
import './index.css';
import './i18n/index.js';
import Login from './pages/auth/LoginPage.jsx';
import Register from './pages/auth/RegisterPage.jsx';
import RestorePasswordPage from './pages/auth/RestorePasswordPage.jsx';
import TerminosCondiciones from './pages/index/terminos-condiciones.jsx';
import IndexWrapper from './pages/index/IndexWrapper.jsx';
import Homepage from './pages/index/Homepage.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminDashboardWrapper from './pages/admin/AdminDashboardWrapper.jsx';
import AdminUsersList from './pages/admin/AdminUsersList.jsx';
import AdminUserDetail from './pages/admin/AdminUserDetail.jsx';
import AdminCompaniesList from './pages/admin/AdminCompaniesList.jsx';
import AdminCompanyDetail from './pages/admin/AdminCompanyDetail.jsx';
import CustomerProfile from './pages/user/CustomerProfile.jsx';
import UserWrapper from './pages/user/UserWrapper.jsx';
import UserDashboard from './pages/user/UserDashboard.jsx';
import Team from './pages/user/Team.jsx';
import AcceptInvitePage from './pages/auth/AcceptInvitePage.jsx';
import RecoverPasswordPage from './pages/auth/RecoverPasswordPage.jsx';
import FAQ from './pages/index/sections/FAQ.jsx';
import AuthWrapper from './pages/auth/AuthWrapper.jsx';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import UserBilling from './pages/user/UserBilling.jsx';
import { PricingPage } from './pages/index/PricingPage.jsx';
import { RoutedErrorBoundary } from './components/ErrorBoundary.jsx';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2025-05-24',
    debug: false,
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider>
      <PostHogProvider client={posthog}>
        <Notifications />
        <BrowserRouter>
          <RoutedErrorBoundary>
            <Routes>

              <Route path="/" element={<IndexWrapper />}>

                <Route index element={<Homepage />} />

                <Route path='terminos-condiciones' element={<TerminosCondiciones />} />
                <Route path='preguntas-frecuentes' element={<FAQ />} />
                <Route path='pricing' element={<PricingPage />} />
              </Route>

              <Route path='/admin' element={<AdminDashboardWrapper />} >
                <Route index element={<AdminOverview />} />
                <Route path='users' element={<AdminUsersList />} />
                <Route path='users/:userId' element={<AdminUserDetail />} />
                <Route path='companies' element={<AdminCompaniesList />} />
                <Route path='companies/:companyId' element={<AdminCompanyDetail />} />
              </Route>

              <Route path='/user' element={<UserWrapper />} >
                <Route index element={<UserDashboard />} />
                <Route path='profile' element={<CustomerProfile />} />
                <Route path="billing" element={<UserBilling />} />
                <Route path='team' element={<Team />} />
              </Route>

              <Route path="/dashboard" element={<UserWrapper />}>
                <Route index element={<UserDashboard />} />
              </Route>

              <Route path="/auth" element={<AuthWrapper />}>
                <Route index element={<Login />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path='recover-password' element={<RecoverPasswordPage />} />
                <Route path='restore-password' element={<RestorePasswordPage />} />
                <Route path='accept-invite' element={<AcceptInvitePage />} />
              </Route>

              <Route path="/*" element={<PageNotFound />} />
            </Routes>
          </RoutedErrorBoundary>
        </BrowserRouter>
      </PostHogProvider>
    </MantineProvider>
  </StrictMode>
);
