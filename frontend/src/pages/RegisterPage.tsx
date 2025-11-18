import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errorUtils';

//validate
const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Username không được để trống')
      .min(6, 'Username phải có ít nhất 6 ký tự')
      .max(16, 'Username không được quá 16 ký tự')
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Username phải bắt đầu bằng chữ cái và chỉ chứa chữ cái, số, dấu gạch dưới')
      .refine((val) => !val.startsWith('_'), {
        message: 'Username không được bắt đầu bằng dấu gạch dưới',
      }),
    password: z
      .string()
      .min(1, 'Password không được để trống')
      .min(8, 'Password phải có ít nhất 8 ký tự')
      .regex(/[a-z]/, 'Password phải có ít nhất 1 chữ cái thường')
      .regex(/[A-Z]/, 'Password phải có ít nhất 1 chữ cái in hoa')
      .regex(/[0-9]/, 'Password phải có ít nhất 1 số'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      await register(data.username, data.password);
      
      toast.success('Đăng kí thành công!');
      
      //redirect về login page
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Đăng ký thất bại'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Đăng ký</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập username (6-16 ký tự)"
                        autoComplete="username"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Nhập password (tối thiểu 8 ký tự)"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhập lại Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Nhập lại password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Đăng ký
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

