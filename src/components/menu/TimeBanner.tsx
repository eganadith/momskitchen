/**
 * Shown when ordering is closed (outside meal times).
 */

import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const MESSAGE =
  "Orders are currently closed. Please check back during meal times.";

export function TimeBanner() {
  return (
    <Card className="border border-border bg-muted rounded-2xl">
      <CardContent className="flex items-center gap-3 py-6">
        <Clock className="h-8 w-8 shrink-0 text-muted-foreground" />
        <p className="text-base font-medium text-muted-foreground">
          {MESSAGE}
        </p>
      </CardContent>
    </Card>
  );
}
