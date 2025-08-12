import React from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import CustomerNavbar from '@/components/customer/CustomerNavbar'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(), // read-only in UI
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  billingInfo: z.object({
    company: z.string().optional(),
    taxId: z.string().optional(),
    defaultPaymentMethodId: z.string().optional(),
    razorPayCustomerId: z.string().optional(),
  }).optional(),
  preferences: z.object({
    notifyByEmail: z.boolean().optional(),
    notifyBySMS: z.boolean().optional(),
  }).optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const { register, handleSubmit, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: {},
      billingInfo: {},
      preferences: { notifyByEmail: false, notifyBySMS: false },
    },
  })

  React.useEffect(() => {
    const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
    if (!userJson) {
      navigate('/login', { replace: true })
      return
    }
    const fetchMe = async () => {
      try {
        setLoading(true)
        const res = await axios.get('http://localhost:3000/api/v1/user/profile', { withCredentials: true })
        const u = res?.data?.data || {}
        reset({
          name: u.name ?? '',
          email: u.email ?? '',
          phone: u.phone ?? '',
          address: {
            street: u.address?.street ?? '',
            city: u.address?.city ?? '',
            state: u.address?.state ?? '',
            postalCode: u.address?.postalCode ?? '',
            country: u.address?.country ?? '',
          },
          billingInfo: {
            company: u.billingInfo?.company ?? '',
            taxId: u.billingInfo?.taxId ?? '',
            defaultPaymentMethodId: u.billingInfo?.defaultPaymentMethodId ?? '',
            razorPayCustomerId: u.billingInfo?.razorPayCustomerId ?? '',
          },
          preferences: {
            notifyByEmail: !!u.preferences?.notifyByEmail,
            notifyBySMS: !!u.preferences?.notifyBySMS,
          },
        })
        localStorage.setItem('currentUser', JSON.stringify(u))
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [])

  const onSubmit = async (data: ProfileForm) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      const { email: _omit, ...payload } = data as any
      const res = await axios.patch('http://localhost:3000/api/v1/user/update', payload, { withCredentials: true })
      const updated = res?.data?.data
      if (updated) localStorage.setItem('currentUser', JSON.stringify(updated))
      setSuccess('Profile updated successfully')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold gradient-text">My profile</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard/customer')}>Back</Button>
            <Button onClick={() => navigate('/profile/change-password')}>Change password</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>Update your personal information. Email cannot be changed.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" {...register('email')} disabled />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
              </div>
              <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="street">Street</Label>
                  <Input id="street" {...register('address.street')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register('address.city')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" {...register('address.state')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="postalCode">Postal code</Label>
                  <Input id="postalCode" {...register('address.postalCode')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" {...register('address.country')} />
                </div>
              </div>
              <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" {...register('billingInfo.company')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input id="taxId" {...register('billingInfo.taxId')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="defaultPaymentMethodId">Default payment method</Label>
                  <Input id="defaultPaymentMethodId" {...register('billingInfo.defaultPaymentMethodId')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="razorPayCustomerId">RazorPay customer ID</Label>
                  <Input id="razorPayCustomerId" {...register('billingInfo.razorPayCustomerId')} />
                </div>
              </div>
              <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('preferences.notifyByEmail')} />
                  Notify by email
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('preferences.notifyBySMS')} />
                  Notify by SMS
                </label>
              </div>
            </CardContent>
            <CardFooter className="flex items-center gap-3">
              <Button type="submit" className="btn-gradient" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
              {loading && <span className="text-sm text-muted-foreground">Loading…</span>}
              {error && <span className="text-sm text-destructive">{error}</span>}
              {success && <span className="text-sm text-green-600">{success}</span>}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}