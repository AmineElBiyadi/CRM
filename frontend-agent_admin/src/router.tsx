import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()

export const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: () => (
    <div className="min-h-screen bg-ghost flex">
      <aside className="hidden lg:flex w-64 shrink-0 p-6 flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl skeleton-shimmer" />
          <div className="space-y-2">
            <div className="h-4 w-28 rounded skeleton-shimmer" />
            <div className="h-3 w-20 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-11 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between glass rounded-none border-x-0 border-t-0">
          <div className="h-10 max-w-xl flex-1 rounded-full skeleton-shimmer" />
          <div className="ml-4 h-10 w-10 rounded-full skeleton-shimmer" />
        </header>
        <div className="p-4 md:p-8 space-y-6 max-w-[1400px]">
          <div className="flex items-end justify-between">
            <div className="space-y-3">
              <div className="h-4 w-32 rounded skeleton-shimmer" />
              <div className="h-9 w-72 rounded-xl skeleton-shimmer" />
            </div>
            <div className="h-9 w-44 rounded-full skeleton-shimmer" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[164px] rounded-2xl neu p-5">
                <div className="h-10 w-10 rounded-xl skeleton-shimmer" />
                <div className="mt-6 h-8 w-20 rounded-lg skeleton-shimmer" />
                <div className="mt-3 h-3 w-28 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
          <div className="h-48 rounded-2xl neu p-6">
            <div className="h-5 w-44 rounded skeleton-shimmer" />
            <div className="mt-8 grid grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 rounded-xl skeleton-shimmer" />
              ))}
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl neu p-6 space-y-4">
              <div className="h-5 w-40 rounded skeleton-shimmer" />
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl skeleton-shimmer" />)}
            </div>
            <div className="h-64 rounded-2xl neu p-6 space-y-4">
              <div className="h-5 w-36 rounded skeleton-shimmer" />
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl skeleton-shimmer" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
