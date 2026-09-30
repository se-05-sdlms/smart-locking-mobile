import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, Input, Label, Select, TextField, Typography } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GravityIcon } from "@/components/icons/gravity-icon";
import { deliveryRequestApi } from "@/features/delivery-requests/api";
import { incidentApi } from "@/features/incidents/api";

type Category = { value: string; label: string; description?: string };

const parcelCategories: Category[] = [
  {
    value: "Retrieval",
    label: "Không thể nhận hàng",
    description: "Mã nhận hoặc thao tác mở ngăn gặp lỗi",
  },
  { value: "Parcel", label: "Bưu kiện", description: "Bưu kiện sai, hỏng hoặc thiếu thông tin" },
  {
    value: "Compartment",
    label: "Ngăn tủ",
    description: "Ngăn tủ không mở, không đóng hoặc bị kẹt",
  },
  { value: "Payment", label: "Thanh toán", description: "Thanh toán hoặc phí quá hạn gặp lỗi" },
  { value: "Other", label: "Vấn đề khác", description: "Sự cố khác liên quan đến bưu kiện" },
];

const lockerCategories: Category[] = [
  {
    value: "Locker",
    label: "Locker",
    description: "Màn hình, nguồn điện hoặc toàn bộ locker gặp lỗi",
  },
  {
    value: "Compartment",
    label: "Ngăn tủ",
    description: "Một ngăn tủ không hoạt động bình thường",
  },
  { value: "Other", label: "Vấn đề khác", description: "Sự cố khác tại locker đã đăng ký" },
];

export function IncidentFormScreen(): JSX.Element {
  const { parcelId } = useLocalSearchParams<{ parcelId?: string }>();
  const linkedParcelId = typeof parcelId === "string" ? parcelId : undefined;
  const categories = linkedParcelId ? parcelCategories : lockerCategories;
  const [category, setCategory] = useState<Category>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lockerId, setLockerId] = useState<string>();
  const [loadingContext, setLoadingContext] = useState(!linkedParcelId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (linkedParcelId) return;
    void deliveryRequestApi
      .getProfile()
      .then((profile) => setLockerId(profile.registeredLockerId ?? undefined))
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error ? loadError.message : "Không thể tải locker đã đăng ký."
        )
      )
      .finally(() => setLoadingContext(false));
  }, [linkedParcelId]);

  async function submit(): Promise<void> {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (!category || !cleanTitle || !cleanDescription) {
      setError("Vui lòng chọn loại sự cố và nhập đầy đủ tiêu đề, mô tả.");
      return;
    }
    if (!linkedParcelId && !lockerId) {
      setError("Tài khoản chưa có locker đăng ký để gửi sự cố.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const incident = await incidentApi.create({
        type: category.value,
        title: cleanTitle,
        description: cleanDescription,
        ...(linkedParcelId ? { parcelId: linkedParcelId } : { lockerId }),
      });
      router.replace(`/incidents/${incident.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể gửi báo cáo sự cố.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-8 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-3">
          <Button
            isIconOnly
            variant="secondary"
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
          >
            <GravityIcon name="arrow-left" />
          </Button>
          <View className="flex-1 gap-1">
            <Typography.Heading className="text-2xl">Báo cáo sự cố</Typography.Heading>
            <Typography.Paragraph className="text-muted">
              {linkedParcelId ? "Sự cố liên quan đến bưu kiện này" : "Sự cố tại locker đã đăng ký"}
            </Typography.Paragraph>
          </View>
        </View>

        <Card className="border border-accent">
          <Card.Body className="flex-row items-start gap-3">
            <View className="rounded-full bg-accent-soft p-2.5">
              <GravityIcon name="alert-circle" tone="accent" />
            </View>
            <View className="flex-1 gap-1">
              <Typography.Paragraph className="font-medium">
                Điều gì sẽ xảy ra tiếp theo?
              </Typography.Paragraph>
              <Typography.Paragraph className="text-sm text-muted">
                Hệ thống chuyển báo cáo đến Operator phụ trách locker. Bạn có thể theo dõi từng cập
                nhật trong mục Sự cố của tôi.
              </Typography.Paragraph>
            </View>
          </Card.Body>
        </Card>

        <View className="gap-2">
          <Label className="font-medium">Loại sự cố</Label>
          <Select presentation="bottom-sheet" value={category} onValueChange={setCategory}>
            <Select.Trigger className="h-14 w-full rounded-2xl border border-border bg-field">
              <Select.Value placeholder="Chọn loại sự cố" />
              <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="bottom-sheet">
                {categories.map((item) => (
                  <Select.Item key={item.value} value={item.value} label={item.label}>
                    <Select.ItemLabel />
                    <Select.ItemDescription>{item.description}</Select.ItemDescription>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>
        </View>

        <TextField isRequired>
          <Label>Tiêu đề</Label>
          <Input
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            placeholder="Ví dụ: Ngăn tủ không mở"
          />
        </TextField>
        <TextField isRequired>
          <Label>Mô tả chi tiết</Label>
          <Input
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            className="min-h-36"
            value={description}
            onChangeText={setDescription}
            maxLength={4000}
            placeholder="Mô tả thao tác đã thực hiện, thông báo lỗi và tình trạng hiện tại..."
          />
        </TextField>

        {error ? (
          <Typography.Paragraph className="text-sm text-danger">{error}</Typography.Paragraph>
        ) : null}
        <Button size="lg" isDisabled={loadingContext || submitting} onPress={() => void submit()}>
          <Button.Label>
            {submitting ? "Đang gửi..." : loadingContext ? "Đang tải..." : "Gửi báo cáo"}
          </Button.Label>
          {!submitting && !loadingContext ? (
            <GravityIcon name="arrow-right" tone="accent-foreground" />
          ) : null}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
