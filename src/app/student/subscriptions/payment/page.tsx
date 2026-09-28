'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, Check, Copy, Facebook, Instagram, RefreshCw } from 'lucide-react';
import { Gift } from '@solar-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-states/api-loading-states';
import { RedeemActivationCodeModal } from '@/components/student/subscription/redeem-activation-code-modal';
import { StudentService } from '@/lib/api-services';
import { useStudentAuth } from '@/hooks/use-auth';
import type { StudyPack } from '@/types/api';

// Students pay by BaridiMob transfer to this number, send us the receipt, and get an activation code back
const BARIDIMOB_NUMBER = '00799999004301142293';
const INSTAGRAM_URL = 'https://www.instagram.com/med.adn.dz/';
const FACEBOOK_URL = 'https://www.facebook.com/medadn';

// Same currency format as the price on the plan cards
const formatDzd = (amount: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'DZD' }).format(amount);

function BaridiMobPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useStudentAuth();

  const packId = Number(searchParams.get('packId'));
  const isValidLink = Number.isInteger(packId) && packId > 0;

  const [pack, setPack] = useState<StudyPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeemOpen, setRedeemOpen] = useState(false);

  const loadPack = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Same list the plans page shows, so the amount matches the card the student clicked
      const res: any = await StudentService.getStudyPacks({ page: 1, limit: 24 });
      const data = res?.data?.data || res?.data || res;
      const list: StudyPack[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setPack(list.find((p) => p.id === packId) ?? null);
    } catch (e: any) {
      setError((typeof e?.error === 'string' && e.error) || e?.message || 'Failed to load the plan');
    } finally {
      setLoading(false);
    }
  }, [packId]);

  useEffect(() => {
    if (isValidLink) {
      loadPack();
    } else {
      setLoading(false);
    }
  }, [isValidLink, loadPack]);

  const backToPlans = () => router.push('/student/subscriptions/browse');

  // Packs are sold yearly only; prices come from the API as strings and a missing price means the pack cannot be bought
  const amount = pack ? Number(pack.pricePerYear) : NaN;
  const isAvailable = isValidLink && !!pack && Number.isFinite(amount) && amount > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-xl mx-auto">
        <Button variant="ghost" className="-ml-2" onClick={backToPlans}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to plans
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Pay with BaridiMob</h1>
          <p className="text-muted-foreground">
            Send the payment from the BaridiMob app, then send us the receipt to get your activation code.
          </p>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading your plan..." />
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="flex items-center justify-center gap-2 text-destructive mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load the plan</span>
              </div>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadPack} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : !isAvailable || !pack ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium mb-1">This plan is not available</p>
              <p className="text-muted-foreground mb-4">Please choose a plan on the plans page.</p>
              <Button onClick={backToPlans}>See plans</Button>
            </CardContent>
          </Card>
        ) : (
          <PaymentInstructions
            pack={pack}
            amount={amount}
            email={user?.email}
            onRedeemClick={() => setRedeemOpen(true)}
          />
        )}

        <RedeemActivationCodeModal
          open={redeemOpen}
          onOpenChange={setRedeemOpen}
          onSuccess={() => setRedeemOpen(false)}
        />
      </div>
    </div>
  );
}

function PaymentInstructions({
  pack,
  amount,
  email,
  onRedeemClick,
}: {
  pack: StudyPack;
  amount: number;
  email?: string;
  onRedeemClick: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BARIDIMOB_NUMBER);
      setCopied(true);
      toast.success('BaridiMob number copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the number. Press and hold it to copy it.');
    }
  };

  const steps = [
    <>
      Open the <strong>BaridiMob</strong> app and send exactly <strong>{formatDzd(amount)}</strong> to the
      BaridiMob number above.
    </>,
    <>Take a screenshot of the transfer confirmation.</>,
    <>
      Send the screenshot to us on Instagram or Facebook, with the pack you paid for (
      <strong>{pack.name}</strong>, yearly) and the email of your MedADN account
      {email ? (
        <>
          {' '}
          (<strong className="break-all">{email}</strong>)
        </>
      ) : null}
      .
    </>,
    <>
      We reply with an activation code. Enter it with the <strong>Activation Code</strong> button below to unlock
      your pack.
    </>,
  ];

  return (
    <>
      {/* What the student is paying for */}
      <div className="rounded-xl bg-card border border-foreground/10 p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Pack</p>
          <p className="text-lg font-medium text-foreground leading-tight">{pack.name}</p>
          <p className="text-xs text-muted-foreground mt-1">Yearly plan</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Amount to send</p>
          <p className="text-2xl font-semibold text-foreground whitespace-nowrap">{formatDzd(amount)}</p>
        </div>
      </div>

      {/* Number the transfer goes to */}
      <div className="rounded-xl bg-card border-2 border-primary p-5 space-y-3">
        <p className="text-sm font-medium text-foreground">BaridiMob number (RIP)</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="flex-1 font-mono text-xl sm:text-2xl font-semibold tracking-wide text-foreground break-all select-all">
            {BARIDIMOB_NUMBER}
          </p>
          <Button onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Steps */}
      <div className="rounded-xl bg-card border border-foreground/10 p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">How to pay</h2>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-foreground pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Where to send the receipt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          asChild
          className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] hover:opacity-90 text-white transition-all duration-300"
        >
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            <Instagram className="h-4 w-4 mr-2" />
            Send receipt on Instagram
          </a>
        </Button>
        <Button asChild className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white">
          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
            <Facebook className="h-4 w-4 mr-2" />
            Send receipt on Facebook
          </a>
        </Button>
      </div>

      {/* Redeem the code the student gets back */}
      <div className="flex flex-col items-center gap-3 pt-6 border-t border-border/50">
        <p className="text-sm text-muted-foreground text-center font-medium">Already received your activation code?</p>
        <Button variant="outline" onClick={onRedeemClick} className="w-full sm:w-auto min-w-[200px]">
          <Gift className="h-4 w-4 mr-2" />
          Activation Code
        </Button>
      </div>
    </>
  );
}

export default function BaridiMobPaymentPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading your plan..." />}>
      <BaridiMobPaymentContent />
    </Suspense>
  );
}
