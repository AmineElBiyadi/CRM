import { createFileRoute, redirect } from '@tanstack/react-router'
import { LandingPage } from '@/components/layout/LandingPage'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (token) {
      throw redirect({
        to: '/client',
      });
    }
  },
  component: LandingPage,
})
