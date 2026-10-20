import { Badge } from "@/components/ui/badge";

export function RegistrationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "CONFIRMED":
      return <Badge tone="success" dot>Confirmed</Badge>;
    case "PENDING_PAYMENT":
      return <Badge tone="warning" dot>Payment pending</Badge>;
    case "REFUNDED":
      return <Badge tone="neutral" dot>Refunded</Badge>;
    default:
      return <Badge tone="danger" dot>Cancelled</Badge>;
  }
}
