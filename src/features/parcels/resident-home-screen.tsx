import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { GravityIcon } from "@/components/icons/gravity-icon";
import type { RegistrationLocker } from "@/features/auth/types";
import { notificationApi } from "@/features/notifications/api";
import { apiRequest } from "@/lib/api-client";
import { parcelApi, parcelDemo } from "./api";
import { dueLabel, parcelDate, parcelStatusLabel } from "./display";
import { Action, Chip, colors, OrangeHeader, ParcelArt, ParcelThumb, styles } from "./parcel-ui";
import type { ParcelListItem } from "./types";

export function ResidentHomeContent() {
  const [parcels, setParcels] = useState<ParcelListItem[]>([]);
  const [recent, setRecent] = useState<ParcelListItem[]>([]);
  const [locker, setLocker] = useState<RegistrationLocker>();
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [secondaryError, setSecondaryError] = useState("");
  const version = useRef(0);

  const load = useCallback(async (refresh = false) => {
    const request = ++version.current;
    if (refresh) setRefreshing(true);
    setError("");
    setSecondaryError("");
    const results = await Promise.allSettled([
      parcelApi.getActive(),
      parcelApi.getHistory(),
      parcelDemo
        ? Promise.resolve({ id: "demo-locker", code: "LK-01", address: "123 Trần Phú, Đà Nẵng" })
        : apiRequest<{
            registeredLockerId: string | null;
            registeredLockerCode: string | null;
            registeredLockerAddress: string | null;
          }>("/residents/me", { authenticated: true }).then((profile) =>
            profile.registeredLockerId && profile.registeredLockerCode
              ? {
                  id: profile.registeredLockerId,
                  code: profile.registeredLockerCode,
                  address: profile.registeredLockerAddress ?? "Chưa có địa chỉ tủ",
                }
              : undefined
          ),
      parcelDemo ? Promise.resolve([]) : notificationApi.getAll(true),
    ]);
    if (request !== version.current) return;
    const [active, history, registered, notifications] = results;
    if (active.status === "fulfilled") setParcels(active.value);
    else
      setError(active.reason instanceof Error ? active.reason.message : "Không thể tải bưu kiện.");
    if (history.status === "fulfilled")
      setRecent(
        [...history.value]
          .sort(
            (a, b) =>
              Date.parse(b.retrievedAt ?? b.removedAt ?? b.storedAt) -
              Date.parse(a.retrievedAt ?? a.removedAt ?? a.storedAt)
          )
          .slice(0, 2)
      );
    else setSecondaryError("Chưa tải được bưu kiện gần đây. Kéo xuống để thử lại.");
    if (registered.status === "fulfilled") setLocker(registered.value);
    if (notifications.status === "fulfilled") setUnread(notifications.value.length);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        version.current++;
      };
    }, [load])
  );

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right"]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.orange}
          />
        }
      >
        <OrangeHeader>
          <SafeAreaView edges={["top"]}>
            <View style={styles.between}>
              <View style={[styles.row, { flex: 1 }]}>
                <Svg width={28} height={36} viewBox="0 0 24 30">
                  <Path
                    d="M12 0C5 0 1 5 1 11c0 7 11 19 11 19s11-12 11-19C23 5 19 0 12 0Z"
                    fill="white"
                  />
                  <Path d="M12 6a5 5 0 1 0 0 10 5 5 0 0 0 0-10" fill="#FF8B29" />
                </Svg>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: "white", fontSize: 21, fontWeight: "700" }}>
                    {locker ? `Tủ ${locker.code}` : "Boxora"}
                  </Text>
                  <Text numberOfLines={2} style={{ color: "#FFF5E7", fontSize: 13 }}>
                    {locker?.address ?? "Tủ đã đăng ký chưa có thông tin"}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Thông báo${unread ? `, ${unread} chưa đọc` : ""}`}
                onPress={() => router.push("/notifications")}
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#FFFBF1",
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <GravityIcon name="bell" size={25} color={colors.ink} />
                {unread > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -3,
                      right: -3,
                      backgroundColor: colors.red,
                      borderRadius: 12,
                      minWidth: 20,
                      padding: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 10,
                        textAlign: "center",
                        fontWeight: "700",
                      }}
                    >
                      {unread >= 50 ? "50+" : unread}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </OrangeHeader>
        <View style={styles.body}>
          {parcelDemo && <Text style={styles.demo}>Dữ liệu demo · Không điều khiển tủ thật</Text>}
          <View style={styles.between}>
            <Text style={styles.heading}>Bưu kiện đang chờ nhận</Text>
            <GravityIcon name="arrow-right" color={colors.muted} size={18} />
          </View>
          {loading ? (
            <ActivityIndicator color={colors.orange} style={{ padding: 50 }} />
          ) : error ? (
            <View style={styles.card}>
              <Text style={styles.text}>{error}</Text>
              <Action label="Thử lại" onPress={() => void load()} />
            </View>
          ) : parcels.length ? (
            parcels.map((parcel) => <PendingParcel key={parcel.id} parcel={parcel} />)
          ) : (
            <View style={{ alignItems: "center", paddingTop: 24, paddingBottom: 12, gap: 16 }}>
              <ParcelArt size={150} open />
              <Text
                style={[styles.heading, { textAlign: "center", lineHeight: 28, maxWidth: 300 }]}
              >
                Hiện tại không có bưu kiện nào đang chờ nhận
              </Text>
              <Text style={[styles.muted, { textAlign: "center" }]}>
                Khi có bưu kiện mới, chúng sẽ hiển thị tại đây.
              </Text>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/returns")}
            style={({ pressed }) => [
              {
                borderRadius: 22,
                borderWidth: 2,
                borderColor: "white",
                backgroundColor: "#FFF0E5",
                padding: 21,
                opacity: pressed ? 0.7 : 1,
              },
              styles.between,
            ]}
          >
            <View style={styles.row}>
              <GravityIcon name="package" size={42} color={colors.orange} />
              <Text style={styles.heading}>Gửi hàng trả</Text>
            </View>
            <GravityIcon name="arrow-right" color={colors.orange} />
          </Pressable>
          <View style={{ gap: 14 }}>
            <View style={styles.between}>
              <Text style={styles.heading}>Bưu kiện gần đây</Text>
              <Pressable
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => router.push("/history")}
              >
                <Text style={{ color: "#248ABE", fontSize: 13 }}>Xem tất cả</Text>
              </Pressable>
            </View>
            <View style={[styles.card, { paddingVertical: 4 }]}>
              {secondaryError ? (
                <Text style={[styles.muted, { paddingVertical: 18 }]}>{secondaryError}</Text>
              ) : recent.length ? (
                recent.map((parcel, index) => (
                  <Pressable
                    key={parcel.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/parcels/${parcel.id}`)}
                    style={[
                      styles.row,
                      {
                        paddingVertical: 14,
                        borderBottomWidth: index < recent.length - 1 ? 1 : 0,
                        borderBottomColor: colors.line,
                      },
                    ]}
                  >
                    <ParcelArt size={56} />
                    <View style={{ flex: 1, gap: 7 }}>
                      <View style={[styles.row, { flexWrap: "wrap", gap: 6 }]}>
                        <Text style={{ color: colors.ink, fontWeight: "700", fontSize: 15 }}>
                          #{parcel.parcelCode}
                        </Text>
                        <Chip label={parcelStatusLabel(parcel.status)} status={parcel.status} />
                      </View>
                      <Text style={styles.muted}>
                        {parcel.status === "Retrieved" ? "Nhận lúc" : "Đã chuyển đi"}:{" "}
                        {parcelDate(parcel.retrievedAt ?? parcel.removedAt ?? parcel.storedAt)}
                      </Text>
                    </View>
                    <GravityIcon name="arrow-right" size={17} color={colors.muted} />
                  </Pressable>
                ))
              ) : (
                <Text style={[styles.muted, { paddingVertical: 18 }]}>
                  Chưa có bưu kiện trong lịch sử.
                </Text>
              )}
            </View>
          </View>
          <Action secondary label="Mở mã QR cá nhân" onPress={() => router.push("/personal-qr")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PendingParcel({ parcel }: { parcel: ParcelListItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chi tiết bưu kiện ${parcel.parcelCode}`}
      onPress={() => router.push(`/parcels/${parcel.id}`)}
      style={({ pressed }) => [
        styles.card,
        styles.row,
        { alignItems: "flex-start", opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <ParcelThumb compartment={parcel.compartmentCode} size={86} />
      <View style={{ flex: 1, gap: 10 }}>
        <View style={{ gap: 7 }}>
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800" }}>
            #{parcel.parcelCode}
          </Text>
          <Chip label={parcelStatusLabel(parcel.status)} status={parcel.status} />
        </View>
        <View style={styles.row}>
          <GravityIcon name="package" size={17} color={colors.ink} />
          <Text style={styles.text}>Ngăn số {parcel.compartmentCode}</Text>
        </View>
        <View style={[styles.row, { gap: 8 }]}>
          <GravityIcon name="clock" size={17} color={colors.muted} />
          <Text style={[styles.muted, { flex: 1 }]}>Đã gửi vào: {parcelDate(parcel.storedAt)}</Text>
        </View>
        <View style={[styles.row, { gap: 8 }]}>
          <GravityIcon name="clock" size={17} color={colors.red} />
          <Text
            style={{ color: colors.red, fontSize: 12, lineHeight: 18, flex: 1, fontWeight: "600" }}
          >
            Hạn nhận: {parcelDate(parcel.pickupDueAt)}
            {"\n"}({dueLabel(parcel.pickupDueAt).toLowerCase()})
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
