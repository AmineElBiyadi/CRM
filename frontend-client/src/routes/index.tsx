import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/components/layout/LandingPage'

export const Route = createFileRoute('/')({
  component: LandingPage,
})
