import { Button, Card, Label, Radio, RadioGroup, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { GravityIcon, type GravityIconName } from "@/components/icons/gravity-icon";
import type { AccountPackage } from "@/features/account-packages/types";

export const formatPackagePrice = (price: number): string =>
  price === 0 ? "Miễn phí" : `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

export function PackageBenefit({ icon, text }: { icon: GravityIconName; text: string }): JSX.Element {
  return (
    <View className="flex-row items-start gap-2">
      <GravityIcon name={icon} tone="accent" />
      <Typography.Paragraph className="flex-1 text-sm text-muted">{text}</Typography.Paragraph>
    </View>
  );
}

export function PackagePicker({
  plans,
  selectedId,
  onSelect,
  loading,
  error,
  onRetry,
  disabled = false,
}: {
  plans: AccountPackage[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  disabled?: boolean;
}): JSX.Element {
  const options: (AccountPackage | null)[] = [null, ...plans];
  return (
    <View className="gap-3">
      <Typography.Heading className="text-lg">Chọn gói tài khoản</Typography.Heading>
      {loading ? <Spinner size="sm" /> : null}
      <RadioGroup
        value={selectedId ?? "default"}
        onValueChange={(value) => onSelect(value === "default" ? null : value)}
        isDisabled={disabled}
        accessibilityLabel="Gói tài khoản"
        className="gap-3"
      >
        {options.map((plan) => {
          const id = plan?.id ?? null;
          const selected = selectedId === id;
          const name = plan?.name ?? "Gói Cơ bản";
          return (
            <RadioGroup.Item
              key={id ?? "default"}
              value={id ?? "default"}
              accessibilityLabel={name}
              className="w-full p-0"
            >
              <Card className={`w-full border-2 ${selected ? "border-accent" : "border-transparent"}`}>
                <Card.Body className="gap-3">
                  <View className="flex-row items-center gap-2">
                    <Label className="flex-1 text-base font-semibold">{name}</Label>
                    <Radio />
                  </View>
                  <Typography.Paragraph className="font-semibold text-accent">
                    {plan
                      ? `${formatPackagePrice(plan.price)} / ${plan.durationDays} ngày`
                      : "Gói mặc định"}
                  </Typography.Paragraph>
                  {plan?.description ? (
                    <Typography.Paragraph className="text-sm text-muted">
                      {plan.description}
                    </Typography.Paragraph>
                  ) : null}
                  <PackageBenefit
                    icon="package"
                    text={plan
                      ? `Tối đa ${plan.maxActiveParcels} bưu kiện cùng lúc`
                      : "Hạn mức theo chính sách hiện hành của tủ"}
                  />
                  <PackageBenefit
                    icon="clock"
                    text="Thời gian lưu miễn phí theo chính sách tủ và hạn nhận trên từng bưu kiện"
                  />
                </Card.Body>
              </Card>
            </RadioGroup.Item>
          );
        })}
      </RadioGroup>
      {error ? (
        <View className="gap-2">
          <Typography.Paragraph className="text-sm text-danger">{error}</Typography.Paragraph>
          <Button size="sm" variant="secondary" isDisabled={disabled || loading} onPress={onRetry}>
            <Button.Label>Thử tải lại các gói</Button.Label>
          </Button>
        </View>
      ) : null}
      {!loading && !error && !plans.length ? (
        <Typography.Paragraph className="text-sm text-muted">
          Hiện chưa có gói bổ sung để đăng ký.
        </Typography.Paragraph>
      ) : null}
    </View>
  );
}
