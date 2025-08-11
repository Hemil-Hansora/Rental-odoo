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

const schema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

type Form = z.infer<typeof schema>

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const onSubmit = async (data: Form) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      await axios.patch('http://localhost:3000/api/v1/user/change-password', data, { withCredentials: true })
      setSuccess('Password changed successfully')
      setTimeout(() => navigate('/profile'), 800)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Enter your current password and a new one.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="oldPassword">Old password</Label>
                <Input id="oldPassword" type="password" {...register('oldPassword')} />
                {errors.oldPassword && <p className="text-sm text-destructive">{errors.oldPassword.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" {...register('newPassword')} />
                {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex items-center gap-3">
              <Button type="submit" className="btn-gradient" disabled={saving}>{saving ? 'Updating...' : 'Update password'}</Button>
              {error && <span className="text-sm text-destructive">{error}</span>}
              {success && <span className="text-sm text-green-600">{success}</span>}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}