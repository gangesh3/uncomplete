import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store, MessageSquare, Star, Eye, Instagram, Facebook,
  TrendingUp, Plus, ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Card, Button, EmptyState, Spinner, Badge } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { Cafe, FeedbackSubmission, EngagementEvent } from '@/lib/types';

interface Stats {
  totalFeedback: number;
  avgRating: number;
  pageViews: number;
  socialClicks: number;
  reviewClicks: number;
}

export function DashboardOverview() {
  const { user, isAdmin, roles } = useAuth();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [stats, setStats] = useState<Stats>({ totalFeedback: 0, avgRating: 0, pageViews: 0, socialClicks: 0, reviewClicks: 0 });
  const [recentFeedback, setRecentFeedback] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const cafeIds = roles.map((r) => r.cafeId);

  useEffect(() => {
    if (cafeIds.length === 0) {
      setLoading(false);
      return;
    }
    loadData();
  }, [cafeIds.join(',')]);

  async function loadData() {
    setLoading(true);
    const query = supabase.from('cafes').select('*').in('id', cafeIds);
    const { data: cafeData } = isAdmin
      ? await supabase.from('cafes').select('*')
      : await query;

    if (cafeData) setCafes(cafeData as Cafe[]);

    const ids = (cafeData as Cafe[])?.map((c) => c.id) || [];
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    const [fbRes, eventRes] = await Promise.all([
      supabase.from('feedback_submissions').select('*').in('cafe_id', ids).order('created_at', { ascending: false }).limit(5),
      supabase.from('engagement_events').select('*').in('cafe_id', ids),
    ]);

    if (fbRes.data) setRecentFeedback(fbRes.data as FeedbackSubmission[]);
    const events = (eventRes.data || []) as EngagementEvent[];

    const allFeedback = fbRes.data as FeedbackSubmission[] || [];
    const ratings = allFeedback.filter((f) => f.overall_rating).map((f) => f.overall_rating!);
    const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    setStats({
      totalFeedback: allFeedback.length,
      avgRating: avg,
      pageViews: events.filter((e) => e.event_type === 'page_view').length,
      socialClicks: events.filter((e) => e.event_type.includes('click') && e.event_type !== 'google_review_click').length,
      reviewClicks: events.filter((e) => e.event_type === 'google_review_click').length,
    });

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (cafes.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome to your dashboard</h1>
        <p className="mt-2 text-slate-600">You don't have any cafés assigned yet.</p>
        {isAdmin && (
          <Card className="mt-6 p-6">
            <EmptyState
              icon={<Store className="w-12 h-12" />}
              title="No cafés yet"
              description="Start by onboarding your first café. The wizard takes you through branding, links, and content step by step."
              action={
                <Link to="/dashboard/cafes/new">
                  <Button icon={<Plus className="w-4 h-4" />}>Add your first café</Button>
                </Link>
              }
            />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin ? 'Managing all cafés on the platform' : 'Your café overview'}
          </p>
        </div>
        {isAdmin && (
          <Link to="/dashboard/cafes/new">
            <Button icon={<Plus className="w-4 h-4" />}>Add café</Button>
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={<MessageSquare className="w-4 h-4" />} label="Feedback" value={stats.totalFeedback.toString()} />
        <StatCard icon={<Star className="w-4 h-4" />} label="Avg Rating" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'} />
        <StatCard icon={<Eye className="w-4 h-4" />} label="Page Views" value={stats.pageViews.toString()} />
        <StatCard icon={<Instagram className="w-4 h-4" />} label="Social Clicks" value={stats.socialClicks.toString()} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Review Clicks" value={stats.reviewClicks.toString()} />
      </div>

      {/* Cafés list */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Your cafés</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cafes.map((cafe) => (
            <Link key={cafe.id} to={`/dashboard/cafes/${cafe.id}`}>
              <Card className="overflow-hidden h-full">
                <div className="h-24 relative" style={{ background: cafe.banner_url ? `url(${cafe.banner_url}) center/cover` : cafe.brand_config.primaryColor }}>
                  {!cafe.banner_url && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Store className="w-8 h-8 text-white/40" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    {cafe.logo_url ? (
                      <img src={cafe.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: cafe.brand_config.primaryColor }}>
                        {cafe.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{cafe.name}</p>
                      <p className="text-xs text-slate-500">/c/{cafe.slug}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {cafe.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="warning">Inactive</Badge>
                    )}
                    {cafe.is_demo && <Badge variant="info">Demo</Badge>}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent feedback */}
      {recentFeedback.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent feedback</h2>
            <Link to="/dashboard/feedback" className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <Card className="divide-y divide-slate-100">
            {recentFeedback.map((fb) => {
              const cafe = cafes.find((c) => c.id === fb.cafe_id);
              return (
                <div key={fb.id} className="p-4 flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {fb.overall_rating ? (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < fb.overall_rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <MessageSquare className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 truncate">
                      {fb.private_feedback_text || fb.selected_feedback_tags.join(', ') || 'Rating only'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cafe?.name} · {formatDateTime(fb.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        {icon}
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}
