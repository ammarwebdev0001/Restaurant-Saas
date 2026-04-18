import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BanIcon } from 'lucide-react';

export default function NoAccessPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center justify-center">
          <BanIcon className="w-10 h-10 text-destructive text-center" />
          <CardTitle className="flex items-center gap-2 justify-center text-xl font-bold text-destructive">
            No Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            You do not have permission to access this module. Contact your
            restaurant admin to request access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
