import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Store, Copy, Edit, Eye, Power, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Card, Button, EmptyState, Spinner, Badge, Modal } from '@/components/ui';
import { QRCodeDisplay } from '@/components/QRCode';
import { slugify } from '@/lib/utils';
import type { Cafe } from '@/lib/types';

export function CafeListPage() {
  const { isAdmin, roles, loading: authLoading } = useAuth();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCafe, setQrCafe] = useState<Cafe | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) return;
    loadCafes();
  }, [isAdmin, authLoading]);

  async function loadCafes() {
    setLoading(true);
    const { data } = await supabase.from('cafes').select('*').order('created_at', { ascending: false });
    if (data) setCafes(data as Cafe[]);
    setLoading(false);
  }

  async function toggleActive(cafe: Cafe) {
    const { error } = await supabase.from('cafes').update({ is_active: !cafe.is_active }).eq('id', cafe.id);
    if (!error) loadCafes();
  }

  async function duplicateCafe(cafe: Cafe) {
    let newSlug = `${cafe.slug}-copy`;
    let counter = 1;
    while (true) {
      const { data } = await supabase.from('cafes').select('id').eq('slug', newSlug).maybeSingle();
      if (!data) break;
      newSlug = `${cafe.slug}-copy-${counter++}`;
    }

    const { data: newCafe, error } = await supabase.from('cafes').insert({
      name: `${cafe.name} (Copy)`,
      slug: newSlug,
      description: cafe.description,
      address: cafe.address,
      logo_url: cafe.logo_url,
      banner_url: cafe.banner_url,
      brand_config: cafe.brand_config,
      page_config: cafe.page_config,
      social_links: cafe.social_links,
      feedback_config: cafe.feedback_config,
      is_active: false,
      is_demo: false,
    }).select().single();

    if (!error && newCafe) {
      loadCafes();
    }
  }

  if (!isAdmin) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cafés</h1>
        <p className="mt-2 text-sm text-slate-500">Only platform administrators can manage all cafés.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const publicUrl = (slug: string) => `${window.location.origin}/c/${slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cafés</h1>
          <p className="mt-1 text-sm text-slate-500">{cafes.length} café{cafes.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <Link to="/dashboard/cafes/new">
          <Button icon={<Plus className="w-4 h-4" />}>Add café</Button>
        </Link>
      </div>

      {cafes.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<Store className="w-12 h-12" />}
            title="No cafés yet"
            description="Onboard your first café using the step-by-step wizard."
            action={
              <Link to="/dashboard/cafes/new">
                <Button icon={<Plus className="w-4 h-4" />}>Add your first café</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cafes.map((cafe) => (
            <Card key={cafe.id} className="overflow-hidden">
              <div className="h-28 relative" style={{ background: cafe.banner_url ? `url(${cafe.banner_url}) center/cover` : cafe.brand_config.primaryColor }}>
                {!cafe.banner_url && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Store className="w-10 h-10 text-white/30" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start gap-2">
                  {cafe.logo_url ? (
                    <img src={cafe.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: cafe.brand_config.primaryColor }}>
                      {cafe.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{cafe.name}</p>
                    <p className="text-xs text-slate-500 truncate">/c/{cafe.slug}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {cafe.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="warning">Inactive</Badge>}
                  {cafe.is_demo && <Badge variant="info">Demo</Badge>}
                </div>

                <div className="mt-4 flex items-center gap-1 flex-wrap">
                  <Link to={`/dashboard/cafes/${cafe.id}`}>
                    <Button size="sm" variant="outline" icon={<Edit className="w-3.5 h-3.5" />}>Edit</Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => setQrCafe(cafe)} icon={<QrCode className="w-3.5 h-3.5" />} />
                  <a href={publicUrl(cafe.slug)} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" icon={<Eye className="w-3.5 h-3.5" />} />
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => duplicateCafe(cafe)} icon={<Copy className="w-3.5 h-3.5" />} />
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(cafe)} icon={<Power className="w-3.5 h-3.5" />} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* QR Modal */}
      <Modal open={!!qrCafe} onClose={() => setQrCafe(null)} title="QR Code" maxWidth="max-w-sm">
        {qrCafe && (
          <div className="text-center">
            <QRCodeDisplay url={publicUrl(qrCafe.slug)} size={240} className="mx-auto rounded-lg" />
            <p className="mt-3 text-sm text-slate-600">{qrCafe.name}</p>
            <p className="text-xs text-slate-400 mt-1">{publicUrl(qrCafe.slug)}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
