import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

// Define the Zod schema for login validation
const signinSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }), // Simple check for presence
});

// Infer the type from the schema
type SigninFormValues = z.infer<typeof signinSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
  });

  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Function to handle form submission
  const onSubmit = async (data: SigninFormValues) => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Call backend signin endpoint and allow cookies
      const response = await axios.post('http://localhost:3000/api/v1/user/signin', data, {
        withCredentials: true,
      });

      const payload = response?.data;
      const user = payload?.data?.user ?? null;
      const accessToken = payload?.data?.accessToken;
      const refreshToken = payload?.data?.refreshToken;

      // Persist tokens if needed for API calls
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user) localStorage.setItem('currentUser', JSON.stringify(user));

      // Redirect based on role
      const role = (user?.role || '').toLowerCase();
      if (role === 'customer' || role === 'vendor' || role === 'seller') {
        navigate('/dashboard/customer', { replace: true });
      } else {
        navigate('/dashboard/user', { replace: true });
      }

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Handle errors from the API (e.g., invalid credentials, user not found)
        setApiError(error.response.data.message || 'Invalid email or password.');
      } else {
        setApiError('Failed to connect to the server.');
      }
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          <CardDescription>Enter your credentials to log in.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>

            {/* API Error Message */}
            {apiError && <p className="text-red-500 text-sm text-center">{apiError}</p>}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full btn-gradient" disabled={isLoading}>
              {isLoading ? 'Logging In...' : 'Log In'}
            </Button>
            <p className="mt-4 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/signup" className="font-medium text-blue-600 hover:underline">
                Sign up
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
