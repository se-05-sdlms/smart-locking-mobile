import { router } from "expo-router";
import { Button, ListGroup } from "heroui-native";
import type { JSX } from "react";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ResidentFeed } from "@/components/ui/resident-feed";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { useResidentFeed } from "@/features/navigation/use-resident-feed";
import { paymentApi } from "@/features/payments/api";
import { paymentState } from "@/features/payments/types";

export default function PaymentHistoryScreen(): JSX.Element {
  const feed = useResidentFeed(paymentApi.getHistory);
  return (
    <ResidentFeed
      {...feed}
      onRefresh={feed.refresh}
      onLoadMore={feed.loadMore}
      onRetryMore={feed.retryMore}
      header={
        <>
          <ScreenHeader title="Lịch sử thanh toán" />
          <Button variant="secondary" onPress={() => router.push("/payment-reconciliations")}>
            <Button.Label>Tra soát của tôi</Button.Label>
          </Button>
        </>
      }
      empty="Bạn chưa có giao dịch thanh toán phí quá hạn."
      icon="receipt"
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const state = paymentState(item.status);
        const amount = new Intl.NumberFormat("vi-VN").format(item.amount) + " " + item.currency;
        return (
          <ListGroup variant="transparent">
            <ListGroup.Item
              className="min-h-20"
              accessibilityRole="button"
              accessibilityLabel={amount + ", " + state.label}
              onPress={() => router.push({ pathname: "/payments/[id]", params: { id: item.id } })}
            >
              <ListGroup.ItemPrefix>
                <GravityIcon name="receipt" />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{amount}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.requestedAt))}
                </ListGroup.ItemDescription>
                <StatusBadge label={state.label} tone={state.tone} />
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <GravityIcon name="chevron-right" />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        );
      }}
    />
  );
}
