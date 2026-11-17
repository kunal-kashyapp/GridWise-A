import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';

// Create TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 4000,
      retry: 1,
    },
  },
});

// Lazy loaded page components supporting both default and named exports
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m: any) => ({ default: m.default || m.Dashboard }))
);
const ZoneDetail = lazy(() =>
  import('./pages/ZoneDetail').then((m: any) => ({ default: m.default || m.ZoneDetail }))
);
const Forecasts = lazy(() =>
  import('./pages/Forecasts').then((m: any) => ({ default: m.default || m.Forecasts }))
);
const AgentConsole = lazy(() =>
  import('./pages/AgentConsole').then((m: any) => ({ default: m.default || m.AgentConsole }))
);
const Settings = lazy(() =>
  import('./pages/Settings').then((m: any) => ({ default: m.default || m.Settings }))
);

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[360px] text-[#6B5B4E]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-[#2D6A2E] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold tracking-wide uppercase text-[#7A5C2E]">
        Loading Console View...
      </span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PageShell>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/zones" element={<ZoneDetail />} />
              <Route path="/zones/:id" element={<ZoneDetail />} />
              <Route path="/forecasts" element={<Forecasts />} />
              <Route path="/agent" element={<AgentConsole />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </PageShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
