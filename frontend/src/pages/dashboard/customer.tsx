import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

export default function CustomerDashboard() {
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
            <h1 className="text-2xl font-semibold gradient-text">Customer dashboard</h1>
            <p className="text-muted-foreground">Welcome{user?.name ? `, ${user.name}` : ''}. Manage your listings.</p>
          </div>
          <a href="/" className="text-sm text-muted-foreground hover:underline">Back to home</a>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="card-accent">
            <CardHeader>
              <CardTitle>Active listings</CardTitle>
              <CardDescription>Currently available to rent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">5</div>
            </CardContent>
          </Card>
          <Card className="card-accent">
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>This week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">3</div>
            </CardContent>
          </Card>
          <Card className="card-accent">
            <CardHeader>
              <CardTitle>Earnings</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">$624</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Manage your items</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button className="btn-gradient">Add new item</Button>
            <Button variant="outline">View bookings</Button>
            <Button variant="ghost">Support</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
