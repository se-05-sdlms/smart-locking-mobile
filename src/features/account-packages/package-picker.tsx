import { Button, Card, Spinner, Typography } from "heroui-native";
import type { JSX } from "react";
import { Pressable, View } from "react-native";

import { PackageIcon, type PackageIconName } from "@/features/account-packages/package-icon";
import type { AccountPackage } from "@/features/account-packages/types";

export const formatPackagePrice = (price: number): string =>
  price === 0 ? "Miễn phí" : `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

export function PackageBenefit({ icon, text }: { icon: PackageIconName; text: string }): JSX.Element {
  return (
    <View className="flex-row items-start gap-2">
      <PackageIcon name={icon} />
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
      {options.map((plan) => {
        const id = plan?.id ?? null;
        const selected = selectedId === id;
        const name = plan?.name ?? "Gói Cơ bản";
        return (
          <Pressable
            key={id ?? "default"}
            accessibilityRole="radio"
            accessibilityLabel={name}
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            onPress={() => onSelect(id)}
          >
            <Card className={`border-2 ${selected ? "border-accent" : "border-transparent"}`}>
              <Card.Body className="gap-3">
                <View className="flex-row items-center gap-2">
                  <Typography.Heading className="flex-1 text-base">{name}</Typography.Heading>
                  {selected ? <PackageIcon name="circle-check" /> : null}
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
                  icon="box"
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
          </Pressable>
        );
      })}
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
