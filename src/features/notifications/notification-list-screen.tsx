import { Button, Dialog, ListGroup, Separator, Tabs, Typography } from "heroui-native";
import type { JSX } from "react";
import { useMemo, useRef, useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { ScreenHeader } from "@/components/ui/resident-ui";
import { ActionError } from "@/components/ui/action-error";
import { ResidentFeed } from "@/components/ui/resident-feed";
import { useResidentFeed } from "@/features/navigation/use-resident-feed";
import { notificationApi } from "@/features/notifications/api";
import { openNotificationTarget } from "@/features/notifications/navigation";
import type { ResidentNotification } from "@/features/notifications/types";

type Filter = "all" | "incoming" | "outgoing" | "system";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "incoming", label: "Nhận" },
  { value: "outgoing", label: "Gửi" },
  { value: "system", label: "Hệ thống" },
];
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" });
const detailDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});
export function NotificationListScreen(): JSX.Element {
  const feed = useResidentFeed(notificationApi.getPage);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<ResidentNotification | null>(null);
  const [readErrors, setReadErrors] = useState<Record<string, string>>({});
  const [marking, setMarking] = useState<string[]>([]);
  const pending = useRef(new Set<string>());
  const { height } = useWindowDimensions();
  const visible = useMemo(
    () => feed.items.filter((item) => filter === "all" || category(item.type) === filter),
    [feed.items, filter]
  );
  const markRead = async (item: ResidentNotification) => {
    if (item.isRead || pending.current.has(item.id)) return;
    pending.current.add(item.id);
    setMarking((current) => [...current, item.id]);
    setReadErrors((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    feed.setItems((current) =>
      current.map((value) => (value.id === item.id ? { ...value, isRead: true } : value))
    );
    try {
      await notificationApi.markRead(item.id);
    } catch (error) {
      feed.setItems((current) =>
        current.map((value) => (value.id === item.id ? { ...value, isRead: false } : value))
      );
      setReadErrors((current) => ({
        ...current,
        [item.id]:
          error instanceof Error
            ? error.message
            : "Chưa lưu được trạng thái đã đọc. Vui lòng thử lại.",
      }));
    } finally {
      pending.current.delete(item.id);
      setMarking((current) => current.filter((id) => id !== item.id));
    }
  };
  const open = (item: ResidentNotification) => {
    setSelected(item);
    void markRead(item);
  };
  const linked =
    selected &&
    (selected.parcelId ||
      selected.deliveryRequestId ||
      selected.incidentId ||
      selected.paymentTransactionId ||
      selected.returnRequestId);
  return (
    <>
      <ResidentFeed
        {...feed}
        items={visible}
        onRefresh={feed.refresh}
        onLoadMore={feed.loadMore}
        onRetryMore={feed.retryMore}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationRow item={item} onPress={open} />}
        emptyTitle="Chưa có thông báo"
        empty="Thông báo phù hợp sẽ xuất hiện trong mục này."
        icon="bell"
        header={
          <>
            <ScreenHeader title="Thông báo" />
            <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
              <Tabs.List>
                <Tabs.ScrollView>
                  <Tabs.Indicator />
                  {filters.map((item) => (
                    <Tabs.Trigger key={item.value} value={item.value}>
                      <Tabs.Label>{item.label}</Tabs.Label>
                    </Tabs.Trigger>
                  ))}
                </Tabs.ScrollView>
              </Tabs.List>
            </Tabs>
          </>
        }
      />
      <Dialog
        isOpen={!!selected}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
      >
        <Dialog.Portal unstable_accessibilityContainerViewIsModal>
          <Dialog.Overlay />
          <Dialog.Content className="mx-5 gap-4 rounded-2xl" style={{ maxHeight: height * 0.85 }}>
            {selected ? (
              <>
                <ScrollView
                  style={{ maxHeight: height * 0.5 }}
                  contentContainerClassName="gap-3"
                  keyboardShouldPersistTaps="handled"
                >
                  <Dialog.Title>{selected.title}</Dialog.Title>
                  <Typography.Paragraph className="text-xs text-muted">
                    {detailDateFormatter.format(new Date(selected.createdAt))}
                  </Typography.Paragraph>
                  <Dialog.Description selectable>{selected.message}</Dialog.Description>
                  {readErrors[selected.id] ? (
                    <ActionError
                      compact
                      title="Chưa lưu được trạng thái đã đọc"
                      message={readErrors[selected.id]}
                      busy={marking.includes(selected.id)}
                      onRetry={() => void markRead(selected)}
                    />
                  ) : null}
                </ScrollView>
                {linked ? (
                  <Button
                    className="min-h-12"
                    onPress={() => {
                      const target = selected;
                      setSelected(null);
                      openNotificationTarget(target);
                    }}
                  >
                    <Button.Label>Mở mục liên quan</Button.Label>
                  </Button>
                ) : null}
                <Button variant="secondary" className="min-h-12" onPress={() => setSelected(null)}>
                  <Button.Label>Đóng thông báo</Button.Label>
                </Button>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
function NotificationRow({
  item,
  onPress,
}: {
  item: ResidentNotification;
  onPress: (item: ResidentNotification) => void;
}): JSX.Element {
  return (
    <ListGroup variant="transparent">
      <ListGroup.Item
        className={`min-h-20 rounded-xl px-3 py-4 ${item.isRead ? "bg-background" : "bg-accent-soft"}`}
        accessibilityRole="button"
        accessibilityLabel={`${item.isRead ? "Đã đọc" : "Chưa đọc"}, ${item.title}, ${dateFormatter.format(new Date(item.createdAt))}. Mở để đọc toàn bộ thông báo.`}
        onPress={() => onPress(item)}
      >
        <ListGroup.ItemContent className="min-w-0 flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className={`h-2 w-2 rounded-full ${item.isRead ? "bg-muted" : "bg-accent"}`} />
            <Typography.Paragraph
              className={`text-xs ${item.isRead ? "text-muted" : "font-semibold text-link"}`}
            >
              {item.isRead ? "Đã đọc" : "Chưa đọc"}
            </Typography.Paragraph>
            <Typography.Paragraph className="text-xs text-muted">
              {dateFormatter.format(new Date(item.createdAt))}
            </Typography.Paragraph>
          </View>
          <ListGroup.ItemTitle numberOfLines={2}>{item.title}</ListGroup.ItemTitle>
          <ListGroup.ItemDescription numberOfLines={2}>{item.message}</ListGroup.ItemDescription>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix>
          <GravityIcon name="chevron-right" size={18} />
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
      <Separator className="my-2" />
    </ListGroup>
  );
}
function category(type: string): Exclude<Filter, "all"> {
  const value = type.toLowerCase();
  if (value.includes("return")) return "outgoing";
  if (value.includes("parcel") || value.includes("delivery") || value.includes("request"))
    return "incoming";
  return "system";
}
