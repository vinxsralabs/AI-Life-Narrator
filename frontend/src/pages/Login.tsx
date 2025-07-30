import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import AnimatedBackground from '../components/ui/AnimatedBackground';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    console.log("Login form submitted with data:", data); // DEBUG LOG
    const success = await login(data.email, data.password);
    if (success) {
      console.log("Login successful, navigating to dashboard."); // DEBUG LOG
      navigate('/dashboard');
    } else {
      console.log("Login function returned false."); // DEBUG LOG
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <Card variant="glass">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue your story</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                {...register('email', { required: 'Email is required' })}
                type="email"
                placeholder="Email"
                icon={<Mail size={18} />}
                error={errors.email?.message}
              />
              <Input
                {...register('password', { required: 'Password is required' })}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                icon={<Lock size={18} />}
                endIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                error={errors.password?.message}
              />
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Sign In
              </Button>
            </form>
            <div className="text-center mt-4 text-sm">
              <p>Demo: demo@lifenarrator.com / demo123</p>
              <Link to="/register" className="text-night-accent hover:underline">
                Don't have an account? Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login; 