import { Label, Radio, RadioGroup, Skeleton, Surface, Typography } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import { ActionError } from "@/components/ui/action-error";
import { GravityIcon, type GravityIconName } from "@/components/icons/gravity-icon";
import type { AccountPackage } from "@/features/account-packages/types";
export const formatPackagePrice = (price: number): string =>
  price === 0 ? "Miễn phí" : `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
export function PackageBenefit({
  icon,
  text,
}: {
  icon: GravityIconName;
  text: string;
}): JSX.Element {
  return (
    <View className="flex-row items-start gap-2">
      <GravityIcon name={icon} tone="accent" />
      <Typography.Paragraph className="min-w-0 flex-1 text-sm text-muted">
        {text}
      </Typography.Paragraph>
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
  const selectedPlan = plans.find((plan) => plan.id === selectedId);
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <View className="gap-3">
      <Typography.Heading className="text-lg">Chọn gói tài khoản</Typography.Heading>
      {loading ? (
        <View className="gap-3">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-28 rounded-xl" />
          ))}
        </View>
      ) : null}
      {error ? (
        <ActionError
          title="Không thể tải các gói"
          message={error}
          busy={disabled || loading}
          onRetry={onRetry}
        />
      ) : null}
      {!loading && !error ? (
        <>
          <RadioGroup
            value={selectedId ?? "default"}
            onValueChange={(value) => onSelect(value === "default" ? null : value)}
            isDisabled={disabled}
            accessibilityLabel="Chọn gói tài khoản"
            className="gap-2"
          >
            {options.map((plan) => {
              const value = plan?.id ?? "default";
              const selected = selectedId === (plan?.id ?? null);
              const name = plan?.name ?? "Gói Cơ bản";
              return (
                <RadioGroup.Item
                  key={value}
                  value={value}
                  accessibilityLabel={`${name}, ${plan ? `${formatPackagePrice(plan.price)} cho ${plan.durationDays} ngày, tối đa ${plan.maxActiveParcels} bưu kiện cùng lúc` : "Gói mặc định theo chính sách tủ"}`}
                  onFocus={() => setFocused(value)}
                  onBlur={() => setFocused(null)}
                  className={`min-h-24 w-full flex-row items-start gap-3 rounded-xl border px-4 py-3 ${selected ? "border-2 border-accent bg-accent-soft" : "border-border bg-surface-secondary"} ${focused === value ? "border-2 border-link" : ""}`}
                >
                  <View className="min-w-0 flex-1 gap-1">
                    <Label className="text-base font-semibold">{name}</Label>
                    <Typography.Paragraph className="font-semibold text-link">
                      {plan
                        ? `${formatPackagePrice(plan.price)} / ${plan.durationDays} ngày`
                        : "Gói mặc định"}
                    </Typography.Paragraph>
                    <Typography.Paragraph className="text-sm text-muted">
                      {plan
                        ? `Tối đa ${plan.maxActiveParcels} bưu kiện cùng lúc`
                        : "Hạn mức theo chính sách hiện hành của tủ"}
                    </Typography.Paragraph>
                  </View>
                  <Radio className="mt-1" />
                </RadioGroup.Item>
              );
            })}
          </RadioGroup>
          <Typography.Paragraph className="text-sm text-muted">
            Thời gian lưu miễn phí theo chính sách tủ. Xem hạn nhận trên từng bưu kiện.
          </Typography.Paragraph>
          {selectedPlan?.description ? (
            <Surface variant="secondary" className="gap-1 rounded-xl p-3">
              <Typography.Paragraph className="text-sm font-semibold">
                Thông tin {selectedPlan.name}
              </Typography.Paragraph>
              <Typography.Paragraph selectable className="text-sm text-muted">
                {selectedPlan.description}
              </Typography.Paragraph>
            </Surface>
          ) : null}
          {!plans.length ? (
            <Typography.Paragraph className="text-sm text-muted">
              Hiện chưa có gói bổ sung để đăng ký.
            </Typography.Paragraph>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
