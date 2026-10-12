import { Card, Typography } from "heroui-native";
import type { JSX } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";

export default function PaymentHistoryScreen(): JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-4">
        <ScreenHeader title="Lịch sử thanh toán" />
        <Card>
          <Card.Body className="items-center gap-3 py-10">
            <GravityIcon name="receipt" size={36} />
            <Typography.Heading className="text-lg">Chưa có giao dịch</Typography.Heading>
            <Typography.Paragraph className="text-center text-muted">
              Các khoản phí đã thanh toán sẽ xuất hiện tại đây.
            </Typography.Paragraph>
          </Card.Body>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
