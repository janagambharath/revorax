'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { orgApi, membersApi } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Users, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getVerticalPack } from '@revorax/shared';

// ─── Niche-Specific Onboarding Copy ──────────────────────────────────────────

const NICHE_ONBOARDING: Record<string, {
  welcome: string;
  businessPlaceholder: string;
  importTitle: string;
  importSubtitle: string;
  whatsappSubtitle: string;
  csvHint: string;
  sampleName: string;
  samplePhone: string;
}> = {
  GYM: {
    welcome: 'Set up your gym and start recovering membership revenue.',
    businessPlaceholder: 'FitZone Gym',
    importTitle: 'Import Your Members',
    importSubtitle: 'Upload your existing members via CSV to instantly start sending renewal reminders.',
    whatsappSubtitle: 'Revorax automates membership renewal reminders & follow-ups via WhatsApp.',
    csvHint: "Needs 'Name' and 'Phone' columns. Optional: renewal_date, amount, membership_type.",
    sampleName: 'Raj Sharma',
    samplePhone: '+91 98765 43210',
  },
  CLINIC: {
    welcome: 'Set up your clinic and start filling every appointment slot.',
    businessPlaceholder: 'HealthFirst Clinic',
    importTitle: 'Import Your Patients',
    importSubtitle: 'Upload your patient list to start sending appointment confirmations and recall reminders.',
    whatsappSubtitle: 'Revorax automates appointment reminders & patient recalls via WhatsApp.',
    csvHint: "Needs 'Name' and 'Phone' columns. Optional: last_appointment, treatment_value.",
    sampleName: 'Priya Mehta',
    samplePhone: '+91 87654 32109',
  },
  SALON: {
    welcome: 'Set up your salon and start turning every client into a repeat client.',
    businessPlaceholder: 'GlowUp Studio',
    importTitle: 'Import Your Clients',
    importSubtitle: 'Upload your client list to start sending rebooking reminders and package renewals.',
    whatsappSubtitle: 'Revorax automates rebooking reminders & loyalty follow-ups via WhatsApp.',
    csvHint: "Needs 'Name' and 'Phone' columns. Optional: last_visit, average_spend.",
    sampleName: 'Sneha Kapoor',
    samplePhone: '+91 76543 21098',
  },
  COACHING: {
    welcome: 'Set up your institute and start converting every inquiry into an admission.',
    businessPlaceholder: 'BrightPath Academy',
    importTitle: 'Import Your Students',
    importSubtitle: 'Upload your student list to start sending fee reminders and admission follow-ups.',
    whatsappSubtitle: 'Revorax automates fee reminders & parent communication via WhatsApp.',
    csvHint: "Needs 'Name' and 'Phone' columns. Optional: fee_due_date, amount, batch.",
    sampleName: 'Aarav Patel',
    samplePhone: '+91 65432 10987',
  },
  REAL_ESTATE: {
    welcome: 'Set up your real estate team and start booking more site visits.',
    businessPlaceholder: 'PrimeNest Realty',
    importTitle: 'Import Your Prospects',
    importSubtitle: 'Upload your lead list to start sending qualification messages and visit reminders.',
    whatsappSubtitle: 'Revorax automates lead follow-ups & site visit reminders via WhatsApp.',
    csvHint: "Needs 'Name' and 'Phone' columns. Optional: budget, location, source.",
    sampleName: 'Vikram Singh',
    samplePhone: '+91 54321 09876',
  },
  DENTAL: {
    welcome: 'Set up your dental practice and never miss a patient recall again.',
    businessPlaceholder: 'SmileCare Dental',
    importTitle: 'Import Your Patients',
    importSubtitle: 'Upload your patient list to start sending recall reminders and appointment confirmations.',
    whatsappSubtitle: 'Revorax automates recall reminders & treatment follow-ups via WhatsApp.',
    csvHint: "Needs 'Name' and 'Phone' columns. Optional: last_recall, treatment_value.",
    sampleName: 'Nisha Gupta',
    samplePhone: '+91 43210 98765',
  },
  AGENCY: {
    welcome: 'Set up your agency and start winning more proposals.',
    businessPlaceholder: 'Catalyst Digital',
    importTitle: 'Import Your Clients',
    importSubtitle: 'Upload your client and prospect list to start sending proposal follow-ups and renewal reminders.',
    whatsappSubtitle: 'Revorax automates proposal follow-ups & retainer renewals via WhatsApp.',
    csvHint: "Needs 'Name' and 'Phone' columns. Optional: deal_value, retainer_date.",
    sampleName: 'Rahul Nair',
    samplePhone: '+91 32109 87654',
  },
  OTHER: {
    welcome: 'Set up your business and start recovering revenue.',
    businessPlaceholder: 'Your Business',
    importTitle: 'Import Your Customers',
    importSubtitle: 'Upload your customer list to start sending follow-ups and reminders.',
    whatsappSubtitle: 'Revorax automates follow-ups & reminders via WhatsApp.',
    csvHint: "Needs 'Name' and 'Phone' columns.",
    sampleName: 'Customer Name',
    samplePhone: '+91 98765 43210',
  },
};

export function OnboardingWizard() {
  const { org, setOrg } = useAuthStore();
  const qc = useQueryClient();
  const pack = getVerticalPack(org?.businessType);
  const nicheType = (org?.businessType || 'OTHER').toUpperCase();
  const niche = NICHE_ONBOARDING[nicheType] || NICHE_ONBOARDING.OTHER;
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
        toast.success(`Imported ${res.count} ${pack.primaryEntityPlural} successfully`);
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
        
        {/* Step indicators with niche-specific labels */}
        <div className="flex border-b border-surface-200">
          {[
            { num: 1, icon: Building2, label: pack.shortLabel },
            { num: 2, icon: Users, label: pack.primaryNavLabel },
            { num: 3, icon: MessageSquare, label: 'WhatsApp' },
          ].map((s) => (
            <div key={s.num} className={`flex-1 p-4 text-center border-b-2 transition-colors ${step >= s.num ? 'border-brand-500 text-brand-400' : 'border-transparent text-zinc-600'}`}>
              <s.icon className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xs font-bold uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="p-8">
          {/* Step 1: Business details with niche-specific copy */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-zinc-100">Welcome to Revorax</h2>
                <p className="text-zinc-500 mt-2">{niche.welcome}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">{pack.shortLabel} Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder={niche.businessPlaceholder} />
                </div>
                <div>
                  <label className="label">Support Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder={niche.samplePhone} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Import with niche-specific entity names */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-zinc-100">{niche.importTitle}</h2>
                <p className="text-zinc-500 mt-2">{niche.importSubtitle}</p>
              </div>
              
              <div className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center hover:border-brand-500/50 transition-colors">
                <Users className="w-10 h-10 text-brand-500 mx-auto mb-4" />
                <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                  {isLoading ? 'Importing...' : `Upload ${pack.primaryNavLabel} CSV`}
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isLoading} />
                </label>
                <p className="text-xs text-zinc-500 mt-4">{niche.csvHint}</p>
                <p className="text-xs text-zinc-600 mt-2">
                  Example: <code className="text-zinc-400">{niche.sampleName}, {niche.samplePhone}</code>
                </p>
              </div>

              <div className="text-center">
                <button onClick={() => setStep(3)} className="text-sm text-zinc-500 hover:text-zinc-300">
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Step 3: WhatsApp with niche-specific messaging context */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-zinc-100">Connect WhatsApp</h2>
                <p className="text-zinc-500 mt-2">{niche.whatsappSubtitle}</p>
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
