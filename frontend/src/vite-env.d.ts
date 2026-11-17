/// <reference types="vite/client" />

declare module '@/pages/*' {
  const component: React.ComponentType<any>;
  export default component;
}
