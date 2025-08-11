
import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { api } from "@/lib/api";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  // Match backend model: role is 'customer' | 'end_user'
  role: z.enum(["customer", "end_user"]),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
 
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "customer" },
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  
  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Real signup call
      await api.post("/api/v1/user/signup", data);
      alert("Registration successful. Please log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "Something went wrong. Please try again.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center px-8 pt-8">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Enter your details below to register.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="px-8 py-6 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="vrund patel" {...register("name")} />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="1234567890" {...register("phone")} />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone.message}</p>
              )}
            </div>

            {/* Role select */}
            <div className="space-y-2">
              <Label htmlFor="role">Register as</Label>
              <select
                id="role"
                {...register("role")}
                className="block w-full rounded-md border border-gray-200 bg-white px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                aria-invalid={!!errors.role}
              >
                <option value="customer">Customer</option>
                <option value="end_user">End User</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm">
                  {(errors.role as any).message || "Please select a role."}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>

            {/* API / submit error */}
            {apiError && <p className="text-red-500 text-sm text-center">{apiError}</p>}
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-3 px-8 pb-8">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <p className="text-sm text-gray-600 text-center">
              Already have an account?{" "}
              <a href="/login" className="font-medium text-blue-600 hover:underline">
                Login
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
