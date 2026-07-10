'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { orgApi, membersApi } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Users, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

export function OnboardingWizard() {
  const { org, setOrg } = useAuthStore();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Org Details
  const [name, setName] = useState(org?.name || '');
  const [phone, setPhone] = useState(org?.phone || '');

  // Step 3: WhatsApp
  const [waPhoneId, setWaPhoneId] = useState(org?.whatsappPhoneNumberId || '');
  const [waToken, setWaToken] = useState(org?.whatsappAccessToken || '');

  const isCompleted = org?.settings?.onboardingCompleted;

  if (isCompleted || !org) return null;

  const handleNext = async () => {
    setIsLoading(true);
    try {
      if (step === 1) {
        const updated = await orgApi.update({ name, phone }) as any;
        setOrg(updated);
        setStep(2);
      } else if (step === 2) {
        setStep(3);
      } else if (step === 3) {
        const updated = await orgApi.update({
          whatsappPhoneNumberId: waPhoneId,
          whatsappAccessToken: waToken,
          settings: { ...org.settings, onboardingCompleted: true },
        }) as any;
        setOrg(updated);
        toast.success('Welcome to Revorax!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').filter(Boolean);
        if (lines.length < 2) throw new Error('File is empty or missing headers');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        
        const nameIdx = headers.findIndex(h => h.includes('name'));
        const phoneIdx = headers.findIndex(h => h.includes('phone'));
        
        if (nameIdx === -1 || phoneIdx === -1) {
          throw new Error('CSV must contain Name and Phone columns');
        }

        const members = lines.slice(1).map(line => {
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
          if (!values[nameIdx] || !values[phoneIdx]) return null;
          return { name: values[nameIdx], phone: values[phoneIdx], membershipType: 'MONTHLY' };
        }).filter(Boolean);

        const res = await membersApi.importCsv(members) as any;
        toast.success(`Imported ${res.count} members successfully`);
        qc.invalidateQueries({ queryKey: ['members'] });
        setStep(3);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to parse CSV');
      } finally {
        setIsLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex border-b border-surface-200">
          {[
            { num: 1, icon: Building2, label: 'Business' },
            { num: 2, icon: Users, label: 'Members' },
            { num: 3, icon: MessageSquare, label: 'WhatsApp' },
          ].map((s) => (
            <div key={s.num} className={`flex-1 p-4 text-center border-b-2 transition-colors ${step >= s.num ? 'border-brand-500 text-brand-400' : 'border-transparent text-zinc-600'}`}>
              <s.icon className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xs font-bold uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-zinc-100">Welcome to Revorax</h2>
                <p className="text-zinc-500 mt-2">Let's set up your business details.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Business Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="FitZone Gym" />
                </div>
                <div>
                  <label className="label">Support Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+91 9876543210" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-zinc-100">Import Members</h2>
                <p className="text-zinc-500 mt-2">Upload your existing members via CSV to instantly start recovering revenue.</p>
              </div>
              
              <div className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center hover:border-brand-500/50 transition-colors">
                <Users className="w-10 h-10 text-brand-500 mx-auto mb-4" />
                <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                  {isLoading ? 'Importing...' : 'Upload CSV'}
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isLoading} />
                </label>
                <p className="text-xs text-zinc-500 mt-4">Needs 'Name' and 'Phone' columns.</p>
              </div>

              <div className="text-center">
                <button onClick={() => setStep(3)} className="text-sm text-zinc-500 hover:text-zinc-300">
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-zinc-100">Connect WhatsApp</h2>
                <p className="text-zinc-500 mt-2">Revorax automates renewals & follow-ups via WhatsApp.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Phone Number ID</label>
                  <input value={waPhoneId} onChange={e => setWaPhoneId(e.target.value)} className="input" placeholder="1234567890" />
                </div>
                <div>
                  <label className="label">Access Token</label>
                  <input type="password" value={waToken} onChange={e => setWaToken(e.target.value)} className="input" placeholder="EAAGm0..." />
                </div>
              </div>

              <div className="text-center">
                <button onClick={handleNext} className="text-sm text-zinc-500 hover:text-zinc-300">
                  Skip for now (configure later in Settings)
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            {step > 1 && step < 3 && (
              <button onClick={() => setStep(step - 1)} className="btn-secondary" disabled={isLoading}>
                Back
              </button>
            )}
            {step !== 2 && (
              <button onClick={handleNext} className="btn-primary flex items-center gap-2" disabled={isLoading}>
                {isLoading ? 'Saving...' : step === 3 ? 'Complete Setup' : 'Continue'} 
                {!isLoading && (step === 3 ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
