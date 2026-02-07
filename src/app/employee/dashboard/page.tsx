// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser, logout } from '@/lib/auth';
import { User } from '@/types/auth';
import { LogOut, FileText, CheckCircle, Clock, Briefcase } from 'lucide-react';

export default function EmployeeDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'employee') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-8 text-lg" style={{ background: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Employee Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome, {user.firstName} {user.lastName} • Building trusted medical education content
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Briefcase className="h-3 w-3 mr-1" />
              {user.role}
            </Badge>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Success Message */}
        <Card className="mb-8 border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse"></div>
              <p className="text-purple-800 font-medium">
                💼 Employee access granted! You can create and manage content.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Create Questions</span>
              </CardTitle>
              <CardDescription>
                Add new questions to the medical question bank
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Add Questions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Review Content</span>
              </CardTitle>
              <CardDescription>
                Review and approve submitted content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Review Queue
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span>My Tasks</span>
              </CardTitle>
              <CardDescription>
                View your assigned tasks and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Tasks
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Employee Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">Questions Created</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">Content Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Pending Reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">95%</div>
              <p className="text-xs text-muted-foreground">Quality Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Approved question set for Cardiology module</span>
                <Badge variant="secondary" className="ml-auto">2 hours ago</Badge>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Created 15 new questions for Anatomy Year 1</span>
                <Badge variant="secondary" className="ml-auto">1 day ago</Badge>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>Pending review: Pathology question set</span>
                <Badge variant="secondary" className="ml-auto">2 days ago</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Name:</p>
                <p className="text-muted-foreground">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p className="font-medium">Email:</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <p className="font-medium">University:</p>
                <p className="text-muted-foreground">{user.university || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Role:</p>
                <p className="text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 