import { Routes, Route } from 'react-router'
import { DefaultLayout } from '@/components'
import {
  CommunityListPage,
  CommunityWritePage,
  CommunityDetailPage,
  CommunityEditPage,
} from '@/pages/community'
import { ComponentShowcase } from '@/pages/ComponentShowcase'

export function RouterProvider() {
  return (
    <Routes>
      {/* Header + Footer */}
      <Route element={<DefaultLayout />}>
        <Route path="community">
          <Route index element={<CommunityListPage />} />
          <Route path="write" element={<CommunityWritePage />} />
          <Route path=":postId">
            <Route index element={<CommunityDetailPage />} />
            <Route path="edit" element={<CommunityEditPage />} />
          </Route>
        </Route>

        <Route path="showcase" element={<ComponentShowcase />} />
      </Route>
    </Routes>
  )
}
