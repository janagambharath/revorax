'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contactsApi } from '@/lib/api';
import { formatDate, getVerticalPack } from '@revorax/shared';
import { Search, Plus, Users, Phone, Mail, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ContactsPage() {
  const { org } = useAuthStore();
  const pack = getVerticalPack(org?.businessType);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search, page],
    queryFn: () => contactsApi.list({ search: search || undefined, page, limit: 20 }) as any,
  });

  const contacts = data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Contacts</h1>
          <p className="text-zinc-500 text-sm mt-1">All {pack.customerPluralLabel} and {pack.leadLabel} records in one place</p>
        </div>
        <button className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search contacts..." className="input pl-10 max-w-md" />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400">No contacts found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Email</th><th>Source</th><th>{titleCase(pack.primaryEntity)}?</th><th>Added</th><th></th></tr>
            </thead>
            <tbody>
              {contacts.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 text-sm font-bold">{c.name[0]}</div>
                      <span className="text-zinc-200 font-medium text-sm">{c.name}</span>
                    </div>
                  </td>
                  <td><span className="text-zinc-400 text-sm flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone || '—'}</span></td>
                  <td><span className="text-zinc-400 text-sm flex items-center gap-1"><Mail className="w-3 h-3" />{c.email || '—'}</span></td>
                  <td><span className="badge-gray capitalize">{c.source?.toLowerCase().replace('_', ' ')}</span></td>
                  <td>{c.member ? <span className="badge-green">{titleCase(pack.primaryEntity)}</span> : <span className="badge-gray">No</span>}</td>
                  <td><span className="text-xs text-zinc-500">{formatDate(c.createdAt)}</span></td>
                  <td>
                    <Link href={`/dashboard/contacts/${c.id}`} className="p-1.5 rounded-lg hover:bg-surface-200 text-zinc-500 hover:text-zinc-300 transition-colors inline-flex">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data?.meta && (
          <div className="px-4 py-3 border-t border-surface-200 flex items-center justify-between">
            <p className="text-xs text-zinc-500">Showing {contacts.length} of {data.meta.total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.meta.hasPrev} className="btn-secondary text-xs py-1.5 px-3">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={!data.meta.hasNext} className="btn-secondary text-xs py-1.5 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
