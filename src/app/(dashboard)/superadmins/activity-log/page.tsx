'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Calendar, Mail, Phone, Clock } from 'lucide-react';
import Loading from '@/components/Loading';

interface Activity {
  type: string;
  icon: string;
  title: string;
  description: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  timestamp: string;
  details: any;
}

interface ActivityLogResponse {
  success: boolean;
  date: string;
  totalActivities: number;
  activities: Activity[];
}

export default function ActivityLogPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalActivities, setTotalActivities] = useState(0);

  useEffect(() => {
    fetchActivities();
  }, [selectedDate]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/superadmin/activity-log?date=${selectedDate}`);
      const data: ActivityLogResponse = await response.json();

      if (data.success) {
        setActivities(data.activities);
        setTotalActivities(data.totalActivities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityColor = (type: string) => {
    const colors: { [key: string]: string } = {
      landlord_registered: 'bg-blue-100 text-blue-800',
      tenant_registered: 'bg-green-100 text-green-800',
      manager_registered: 'bg-purple-100 text-purple-800',
      buyer_registered: 'bg-indigo-100 text-indigo-800',
      property_created: 'bg-orange-100 text-orange-800',
      seller_property_created: 'bg-yellow-100 text-yellow-800',
      contract_created: 'bg-teal-100 text-teal-800',
      application_submitted: 'bg-cyan-100 text-cyan-800',
      token_purchase: 'bg-pink-100 text-pink-800',
      token_offering_created: 'bg-violet-100 text-violet-800',
      token_investment: 'bg-emerald-100 text-emerald-800',
      maintenance_request: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Activity Log</h1>
        <p className="text-muted-foreground mt-2">
          Track all platform activities day by day
        </p>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousDay}
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button variant="outline" onClick={handleToday}>
                Today
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              disabled={selectedDate === new Date().toISOString().split('T')[0]}
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-lg font-semibold">{formatDate(selectedDate)}</p>
            <p className="text-sm text-muted-foreground">
              {totalActivities} {totalActivities === 1 ? 'activity' : 'activities'} recorded
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      {loading ? (
        <Loading />
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No activities recorded</p>
              <p className="text-sm text-muted-foreground mt-1">
                There were no activities on {formatDate(selectedDate)}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{activity.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{activity.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {activity.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getActivityColor(activity.type)}>
                      {activity.type.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </CardHeader>

              {(activity.userName || activity.userEmail || activity.userPhone || activity.details) && (
                <>
                  <Separator />
                  <CardContent className="pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* User Contact Information */}
                      {(activity.userName || activity.userEmail || activity.userPhone) && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-muted-foreground">
                            Contact Information
                          </p>
                          {activity.userName && (
                            <p className="text-sm">
                              <span className="font-medium">Name:</span> {activity.userName}
                            </p>
                          )}
                          {activity.userEmail && (
                            <p className="text-sm flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={`mailto:${activity.userEmail}`}
                                className="text-blue-600 hover:underline"
                              >
                                {activity.userEmail}
                              </a>
                            </p>
                          )}
                          {activity.userPhone && (
                            <p className="text-sm flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={`tel:${activity.userPhone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {activity.userPhone}
                              </a>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Additional Details */}
                      {activity.details && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-muted-foreground">
                            Details
                          </p>
                          {Object.entries(activity.details).map(([key, value]: [string, any]) => (
                            value !== null && value !== undefined && (
                              <p key={key} className="text-sm">
                                <span className="font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>{' '}
                                {typeof value === 'boolean'
                                  ? (value ? 'Yes' : 'No')
                                  : typeof value === 'number'
                                  ? value.toLocaleString()
                                  : value}
                              </p>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
