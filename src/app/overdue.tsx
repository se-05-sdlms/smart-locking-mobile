import { router } from "expo-router";
import { Alert, Button, Card, RadioGroup, Separator, Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { AppIcon } from "@/components/icons/app-icon";
import { ParcelCard } from "@/components/parcel-card";
import { AppScreen } from "@/components/ui/app-screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { parcels } from "@/data/mock-data";

export default function OverdueScreen(): JSX.Element {
  const [method, setMethod] = useState("wallet");
  return (
    <AppScreen>
      <ScreenHeader title="Thanh toán quá hạn" back />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-4">
        <ParcelCard parcel={parcels[1]} compact />
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Bưu kiện đã quá hạn</Alert.Title>
            <Alert.Description>Thanh toán phí để tiếp tục mở ngăn.</Alert.Description>
          </Alert.Content>
        </Alert>
        <Card className="gap-3 p-4">
          <View className="flex-row justify-between">
            <Card.Description>Phí quá hạn</Card.Description>
            <Card.Title>20.000đ</Card.Title>
          </View>
          <View className="flex-row justify-between">
            <Card.Description>Phí lưu kho (2 ngày)</Card.Description>
            <Card.Title>10.000đ</Card.Title>
          </View>
          <Separator />
          <View className="flex-row items-center justify-between">
            <Typography.Heading className="text-base">Tổng thanh toán</Typography.Heading>
            <Typography.Heading className="text-xl text-danger">30.000đ</Typography.Heading>
          </View>
        </Card>
        <Typography.Heading className="mt-2 text-base">Phương thức thanh toán</Typography.Heading>
        <RadioGroup value={method} onValueChange={setMethod} className="gap-2">
          <Card className="p-1">
            <RadioGroup.Item value="wallet" className="p-3">
              Ví điện tử (ZaloPay)
            </RadioGroup.Item>
          </Card>
          <Card className="p-1">
            <RadioGroup.Item value="bank" className="p-3">
              Thẻ ngân hàng
            </RadioGroup.Item>
          </Card>
        </RadioGroup>
        <Button size="lg" className="mt-2" onPress={() => router.replace("/unlock")}>
          <AppIcon name="shield" size={19} tone="accent-foreground" />
          <Button.Label>Thanh toán 30.000đ</Button.Label>
        </Button>
      </ScrollView>
    </AppScreen>
  );
}
