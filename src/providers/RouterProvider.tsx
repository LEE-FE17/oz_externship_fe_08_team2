import { Routes, Route, Navigate } from 'react-router'
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
      <Route element={<DefaultLayout />}>
        {/* / -> /community */}
        <Route index element={<Navigate to="/community" replace />} />

        <Route path="community">
          <Route index element={<CommunityListPage />} />
          <Route path="write" element={<CommunityWritePage />} />

          <Route path=":postId">
            <Route index element={<CommunityDetailPage />} />
            <Route path="edit" element={<CommunityEditPage />} />
          </Route>
        </Route>

        <Route path="showcase" element={<ComponentShowcase />} />
        <Route path="*" element={<Navigate to="/community" replace />} />
      </Route>
    </Routes>
  )
}
