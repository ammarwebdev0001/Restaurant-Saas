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
    <main className="min-h-screen bg-muted/20 px-6 py-16">
      <div className="mx-auto max-w-xl rounded-xl border bg-background p-8">
        <h1 className="text-3xl font-bold">Request a Demo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
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

          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Demo Request'}
          </Button>
        </form>
      </div>
    </main>
  );
}
