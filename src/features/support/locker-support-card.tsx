import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { Button, Card, Spinner, Typography } from "heroui-native";
import { useCallback, useRef, useState } from "react";
import { AppState, Linking, View } from "react-native";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { residentAccountApi } from "@/features/account/api";
import { useMobileDataRevision } from "@/features/notifications/data-sync";
import { lockerSupportApi, type LockerSupport } from "./api";

// Accept only a public transaction reference, never pickup codes or access tokens.
export function LockerSupportCard({
  lockerId,
  lockerCode,
  reference,
}: {
  lockerId?: string;
  lockerCode?: string;
  reference?: string;
}) {
  const revision = useMobileDataRevision();
  const [contact, setContact] = useState<LockerSupport | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const generation = useRef(0);
  const load = useCallback(async (): Promise<LockerSupport | null> => {
    const request = ++generation.current;
    setLoading(true);
    setContact(null);
    setMessage("");
    try {
      let result: LockerSupport;
      if (lockerId) result = await lockerSupportApi.forLocker(lockerId);
      else if (lockerCode) result = await lockerSupportApi.byCode(lockerCode);
      else {
        const profile = await residentAccountApi.get();
        if (!profile.registeredLockerId) throw new Error("Hãy đăng ký tủ để xem liên hệ hỗ trợ.");
        result = await lockerSupportApi.forLocker(profile.registeredLockerId);
      }
      if (request !== generation.current) return null;
      setContact(result);
      return result;
    } catch (error) {
      if (request === generation.current)
        setMessage(error instanceof Error ? error.message : "Chưa tải được liên hệ hỗ trợ.");
      return null;
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [lockerId, lockerCode]);

  useFocusEffect(
    useCallback(() => {
      // Notification revisions refresh the current effective contact too.
      void revision;
      const timer = setTimeout(() => void load(), 0);
      const interval = setInterval(() => void load(), 60_000);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void load();
      });
      return () => {
        generation.current++;
        clearTimeout(timer);
        clearInterval(interval);
        subscription.remove();
      };
    }, [load, revision])
  );

  async function call() {
    const latest = await load();
    if (!latest?.isAvailable || !latest.phoneNumber) return;
    try {
      await Linking.openURL(`tel:${latest.phoneNumber}`);
    } catch {
      setMessage("Không mở được ứng dụng gọi điện. Bạn có thể sao chép số bên dưới.");
    }
  }
  async function copy(value: string) {
    try {
      await Clipboard.setStringAsync(value);
      setMessage("Đã sao chép.");
    } catch {
      setMessage("Không sao chép được. Bạn có thể nhấn giữ thông tin để sao chép.");
    }
  }

  return (
    <Card>
      <Card.Body className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <Typography.Heading className="flex-1 text-lg">Hỗ trợ tại tủ</Typography.Heading>
          <Button
            variant="ghost"
            isDisabled={loading}
            onPress={() => void load()}
            accessibilityLabel="Tải lại liên hệ hỗ trợ"
            className="min-h-12"
          >
            <Button.Label>Tải lại</Button.Label>
          </Button>
        </View>
        {loading ? (
          <View className="flex-row items-center gap-2">
            <Spinner size="sm" />
            <Typography.Paragraph>Đang tải liên hệ...</Typography.Paragraph>
          </View>
        ) : null}
        {contact ? (
          <>
            <Typography.Paragraph selectable>Tủ {contact.lockerCode}</Typography.Paragraph>
            <Typography.Heading className="text-base">
              {contact.contactName || "Hướng dẫn liên hệ"}
            </Typography.Heading>
            {contact.isFallback ? (
              <Typography.Paragraph className="text-sm text-muted">
                Liên hệ dự phòng khi người phụ trách chưa sẵn sàng hoặc ngoài giờ.
              </Typography.Paragraph>
            ) : null}
            {contact.supportHours ? (
              <Typography.Paragraph selectable className="text-muted">
                {contact.supportHours}
              </Typography.Paragraph>
            ) : null}
            <Typography.Paragraph selectable>{contact.instructions}</Typography.Paragraph>
            {contact.isAvailable && contact.phoneNumber ? (
              <>
                <Typography.Paragraph selectable>{contact.phoneNumber}</Typography.Paragraph>
                <Button onPress={() => void call()} className="min-h-12">
                  <GravityIcon name="phone" tone="accent-foreground" />
                  <Button.Label>Gọi hỗ trợ</Button.Label>
                </Button>
                <Button
                  variant="secondary"
                  onPress={() => void copy(contact.phoneNumber!)}
                  className="min-h-12"
                >
                  <Button.Label>Sao chép số điện thoại</Button.Label>
                </Button>
              </>
            ) : (
              <Typography.Paragraph className="text-muted">
                Chưa có số hỗ trợ khả dụng. Vui lòng làm theo hướng dẫn trên.
              </Typography.Paragraph>
            )}
            <Typography.Paragraph selectable className="text-sm text-muted">
              {reference ? `Mã giao dịch: ${reference}` : "Hãy cung cấp mã tủ khi liên hệ."}
            </Typography.Paragraph>
            <Button
              variant="secondary"
              className="min-h-12"
              onPress={() =>
                void copy(
                  `Tủ: ${contact.lockerCode}${reference ? `\nGiao dịch: ${reference}` : ""}`
                )
              }
            >
              <GravityIcon name="copy" />
              <Button.Label>Sao chép mã tủ{reference ? " và giao dịch" : ""}</Button.Label>
            </Button>
          </>
        ) : null}
        {message ? (
          <Typography.Paragraph accessibilityLiveRegion="polite" selectable className="text-muted">
            {message}
          </Typography.Paragraph>
        ) : null}
      </Card.Body>
    </Card>
  );
}
