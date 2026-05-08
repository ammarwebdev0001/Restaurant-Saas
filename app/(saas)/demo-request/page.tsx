'use client';

import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';

export default function DemoRequestPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/demo-request', {
        name: name.trim(),
        email: email.trim(),
        restaurant: restaurant.trim(),
      });
      toast.success('Demo request submitted. We will contact you soon.');
      setName('');
      setEmail('');
      setRestaurant('');
    } catch (error: unknown) {
      const msg =
        axios.isAxiosError(error) && error.response?.data?.error
          ? typeof error.response.data.error === 'string'
            ? error.response.data.error
            : 'Could not submit demo request.'
          : 'Could not submit demo request.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-6 py-16 text-zinc-900 dark:bg-black dark:text-white">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-fire-500/20 blur-3xl dark:bg-fire-500/25" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-fire-300/20 blur-3xl dark:bg-fire-700/20" />
      <div className="relative mx-auto max-w-xl rounded-3xl border border-zinc-200/80 bg-white/95 p-8 shadow-[0_30px_80px_-30px] shadow-black/20 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:shadow-black/60">
        <h1 className="text-3xl font-bold md:text-4xl">Request a Demo</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          See how Foodluk SaaS can fit your operation in a guided product
          walkthrough.
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Business email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant">Restaurant / brand name</Label>
            <Input
              id="restaurant"
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-fire-500 via-fire-600 to-fire-500 text-white hover:from-fire-400 hover:to-fire-500"
          >
            {loading ? 'Submitting...' : 'Submit Demo Request'}
          </Button>
        </form>
      </div>
    </main>
  );
}
