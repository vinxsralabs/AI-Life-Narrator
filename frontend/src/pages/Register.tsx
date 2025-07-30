import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import AnimatedBackground from '../components/ui/AnimatedBackground';

interface RegisterForm {
  email: string;
  username: string;
  password: string;
}

const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    const success = await registerUser(data.email, data.username, data.password);
    if (success) {
      navigate('/dashboard');
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
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>Join to start your AI-powered diary</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                {...register('username', { required: 'Username is required' })}
                type="text"
                placeholder="Username"
                icon={<User size={18} />}
                error={errors.username?.message}
              />
              <Input
                {...register('email', { required: 'Email is required' })}
                type="email"
                placeholder="Email"
                icon={<Mail size={18} />}
                error={errors.email?.message}
              />
              <Input
                {...register('password', { required: 'Password is required', minLength: 6 })}
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
                Sign Up
              </Button>
            </form>
            <div className="text-center mt-4 text-sm">
              <Link to="/login" className="text-night-accent hover:underline">
                Already have an account? Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register; 