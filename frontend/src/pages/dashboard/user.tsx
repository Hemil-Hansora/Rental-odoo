import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

export default function UserDashboard() {
  const navigate = useNavigate()
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
  const user = userJson ? JSON.parse(userJson) : null

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold gradient-text">User dashboard</h1>
            <p className="text-muted-foreground">Welcome{user?.name ? `, ${user.name}` : ''}.</p>
          </div>
          <a href="/" className="text-sm text-muted-foreground hover:underline">Back to home</a>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="card-accent">
            <CardHeader>
              <CardTitle>Active rentals</CardTitle>
              <CardDescription>Items you’re currently renting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">2</div>
            </CardContent>
          </Card>
          <Card className="card-accent">
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <CardDescription>Reservations this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">1</div>
            </CardContent>
          </Card>
          <Card className="card-accent">
            <CardHeader>
              <CardTitle>Spent</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">$128</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump right back in</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button className="btn-gradient">Browse items</Button>
            <Button variant="outline">View reservations</Button>
            <Button variant="ghost">Support</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
