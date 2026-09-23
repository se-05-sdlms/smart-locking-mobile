import { router } from "expo-router";
import { Button, Card, Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { AppIcon } from "@/components/icons/app-icon";
import { ParcelCard } from "@/components/parcel-card";
import { AppScreen } from "@/components/ui/app-screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { parcels } from "@/data/mock-data";

export default function UnlockScreen(): JSX.Element {
  const [method, setMethod] = useState<"server" | "bluetooth">("server");
  return (
    <AppScreen>
      <ScreenHeader title="Mở ngăn" back />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="flex-grow pb-4">
        <ParcelCard parcel={parcels[0]} compact />
        <View className="flex-1 items-center justify-center py-8">
          <View className="h-52 w-52 items-center justify-center rounded-full border-[12px] border-accent/15 bg-accent/5">
            <View className="h-40 w-40 items-center justify-center rounded-full bg-accent">
              <AppIcon name="lock" size={48} tone="accent-foreground" />
              <Typography.Heading className="mt-2 text-lg text-accent-foreground">
                Mở ngăn
              </Typography.Heading>
            </View>
          </View>
        </View>
        <View className="mb-3 flex-row gap-3">
          <Card variant={method === "server" ? "secondary" : "default"} className="flex-1 p-2">
            <Button variant="ghost" className="h-16 flex-col" onPress={() => setMethod("server")}>
              <AppIcon name="wifi" tone={method === "server" ? "accent" : "muted"} />
              <Button.Label>Qua server</Button.Label>
            </Button>
          </Card>
          <Card variant={method === "bluetooth" ? "secondary" : "default"} className="flex-1 p-2">
            <Button
              variant="ghost"
              className="h-16 flex-col"
              onPress={() => setMethod("bluetooth")}
            >
              <AppIcon name="bluetooth" tone={method === "bluetooth" ? "accent" : "muted"} />
              <Button.Label>Bluetooth</Button.Label>
            </Button>
          </Card>
        </View>
        <Typography.Paragraph className="mb-4 text-center text-sm text-muted">
          SmartLock tự chọn phương thức ổn định nhất
        </Typography.Paragraph>
        <Button size="lg" onPress={() => router.push("/opening")}>
          <Button.Label>Mở ngăn A03</Button.Label>
        </Button>
      </ScrollView>
    </AppScreen>
  );
}
