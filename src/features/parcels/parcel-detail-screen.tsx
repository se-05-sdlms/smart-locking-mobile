import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { GravityIcon } from "@/components/icons/gravity-icon";
import { parcelApi, parcelDemo } from "./api";
import { dueLabel, parcelDate, parcelStatusLabel, unlockLabel } from "./display";
import { Action, Chip, colors, InfoRow, OrangeHeader, ParcelThumb, styles } from "./parcel-ui";
import type { ParcelDetail, ParcelStatusHistory } from "./types";

export function ParcelDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ParcelDetailView key={String(id)} id={String(id)} />;
}

function ParcelDetailView({ id }: { id: string }) {
  const [parcel, setParcel] = useState<ParcelDetail>();
  const [history, setHistory] = useState<ParcelStatusHistory[]>([]);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState("ready");
  const [unlockError, setUnlockError] = useState("");
  const [showMore, setShowMore] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let live = true;
    void Promise.allSettled([
      parcelApi.getDetail(String(id)),
      parcelApi.getStatusHistory(String(id)),
    ]).then(([detail, timeline]) => {
      if (!live) return;
      if (detail.status === "fulfilled") setParcel(detail.value);
      else
        setError(
          detail.reason instanceof Error ? detail.reason.message : "Không thể tải bưu kiện."
        );
      if (timeline.status === "fulfilled") setHistory(timeline.value);
      else setHistoryError("Chưa tải được lịch sử trạng thái.");
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [id, attempt]);

  async function unlock() {
    if (!parcel || locked.current || state === "sent") return;
    locked.current = true;
    setState("opening");
    setUnlockError("");
    try {
      if (parcelDemo) await new Promise((resolve) => setTimeout(resolve, 1200));
      else {
        const result = await parcelApi.unlock(parcel.id);
        if (result.result !== "Succeeded")
          throw new Error(result.failureReason || "Không thể gửi lệnh mở ngăn.");
      }
      if (mounted.current) setState("sent");
    } catch (err) {
      if (mounted.current) {
        setState("failed");
        setUnlockError(err instanceof Error ? err.message : "Không thể mở ngăn.");
      }
    } finally {
      locked.current = false;
    }
  }

  const active = parcel?.status === "Stored" || parcel?.status === "Overdue";
  const paymentRequired =
    parcel?.overdueAmount != null && parcel.overdueChargeStatus === "Outstanding";
  return (
    <SafeAreaView style={styles.screen} edges={["left", "right"]}>
      <ScrollView>
        <OrangeHeader>
          <SafeAreaView edges={["top"]}>
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quay lại"
                hitSlop={12}
                onPress={() => router.back()}
                style={{ padding: 8 }}
              >
                <GravityIcon name="arrow-left" color="white" size={25} />
              </Pressable>
              <Text
                style={{
                  color: "white",
                  fontSize: 21,
                  fontWeight: "700",
                  flex: 1,
                  textAlign: "center",
                  marginRight: 40,
                }}
              >
                Chi tiết bưu kiện
              </Text>
            </View>
          </SafeAreaView>
        </OrangeHeader>
        <View style={styles.body}>
          {parcelDemo && <Text style={styles.demo}>Dữ liệu demo · Không điều khiển tủ thật</Text>}
          {loading ? (
            <ActivityIndicator color={colors.orange} style={{ padding: 60 }} />
          ) : error || !parcel ? (
            <View style={styles.card}>
              <Text style={styles.text}>{error || "Không tìm thấy bưu kiện."}</Text>
              <Action
                label="Thử lại"
                onPress={() => {
                  setLoading(true);
                  setError("");
                  setHistoryError("");
                  setAttempt((value) => value + 1);
                }}
              />
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <View style={styles.row}>
                  <ParcelThumb
                    key={parcel.parcelImageUrl}
                    uri={parcel.parcelImageUrl}
                    size={80}
                    compartment={parcel.compartmentCode}
                  />
                  <View style={{ flex: 1, gap: 10 }}>
                    <Text style={styles.heading}>#{parcel.parcelCode}</Text>
                    <Chip label={parcelStatusLabel(parcel.status)} status={parcel.status} />
                  </View>
                </View>
                <View>
                  <InfoRow icon="clock">
                    <Text style={styles.muted}>Đã gửi vào tủ</Text>
                    <Text style={styles.text}>{parcelDate(parcel.storedAt)}</Text>
                  </InfoRow>
                  <InfoRow icon="clock" danger>
                    <Text style={styles.muted}>Hạn nhận</Text>
                    <Text style={[styles.text, { color: colors.red, fontWeight: "600" }]}>
                      {parcelDate(parcel.pickupDueAt)} ({dueLabel(parcel.pickupDueAt).toLowerCase()}
                      )
                    </Text>
                  </InfoRow>
                  <InfoRow icon="package">
                    <View style={styles.between}>
                      <Text style={styles.text}>Vị trí ngăn</Text>
                      <Text style={[styles.text, { fontWeight: "700" }]}>
                        Ngăn số {parcel.compartmentCode}
                      </Text>
                    </View>
                  </InfoRow>
                  <InfoRow icon="credit-card">
                    <View style={styles.between}>
                      <Text style={styles.text}>Tủ</Text>
                      <Text style={[styles.text, { fontWeight: "700" }]}>
                        Tủ {parcel.lockerCode}
                      </Text>
                    </View>
                    <Text style={[styles.muted, { marginTop: 4 }]}>{parcel.lockerAddress}</Text>
                  </InfoRow>
                </View>
              </View>
              {active && (
                <>
                  <View
                    style={[styles.card, { alignItems: "center", paddingVertical: 26, gap: 18 }]}
                  >
                    {paymentRequired ? (
                      <>
                        <GravityIcon name="credit-card" size={48} color={colors.orange} />
                        <Text style={styles.heading}>Thanh toán phí quá hạn</Text>
                        <Text style={styles.muted}>
                          {new Intl.NumberFormat("vi-VN").format(parcel.overdueAmount!)}{" "}
                          {parcel.currency || "VND"}
                        </Text>
                        <Action
                          label="Xem thanh toán"
                          onPress={() => router.push(`/payment/${parcel.id}`)}
                        />
                      </>
                    ) : (
                      <>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            state === "failed" ? "Thử mở khóa lại" : "Chạm để mở khóa"
                          }
                          accessibilityState={{
                            disabled: state === "opening" || state === "sent",
                            busy: state === "opening",
                          }}
                          disabled={state === "opening" || state === "sent"}
                          onPress={() => void unlock()}
                          style={({ pressed }) => ({
                            width: 156,
                            height: 156,
                            borderRadius: 78,
                            backgroundColor: "#FFF4E9",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: pressed ? 0.75 : 1,
                            borderWidth: 1,
                            borderColor: "#FFE6CC",
                          })}
                        >
                          <Svg
                            style={{ position: "absolute" }}
                            width={146}
                            height={146}
                            viewBox="0 0 146 146"
                          >
                            <Circle
                              cx="73"
                              cy="73"
                              r="63"
                              fill="none"
                              stroke="#FFDFC0"
                              strokeWidth={2}
                            />
                            <Path
                              d="M73 10a63 63 0 0 1 52 28"
                              fill="none"
                              stroke={colors.orange}
                              strokeWidth={4}
                              strokeLinecap="round"
                            />
                          </Svg>
                          <View
                            style={{
                              width: 110,
                              height: 110,
                              borderRadius: 55,
                              backgroundColor:
                                state === "failed"
                                  ? colors.red
                                  : state === "sent"
                                    ? colors.green
                                    : colors.orange,
                              alignItems: "center",
                              justifyContent: "center",
                              shadowColor: colors.orange,
                              shadowOpacity: 0.3,
                              shadowRadius: 14,
                              shadowOffset: { width: 0, height: 6 },
                              elevation: 5,
                            }}
                          >
                            {state === "opening" ? (
                              <ActivityIndicator size="large" color="white" />
                            ) : state === "sent" ? (
                              <Text style={{ color: "white", fontSize: 46 }}>✓</Text>
                            ) : (
                              <GravityIcon name="lock" size={45} color="white" />
                            )}
                          </View>
                        </Pressable>
                        <Text accessibilityLiveRegion="polite" style={styles.heading}>
                          {state === "ready" ? "Chạm để mở khóa" : unlockLabel(state, parcelDemo)}
                        </Text>
                        {unlockError && (
                          <Text style={{ color: colors.red, textAlign: "center", lineHeight: 21 }}>
                            {unlockError}
                          </Text>
                        )}
                        {state === "sent" && (
                          <Text style={[styles.muted, { textAlign: "center" }]}>
                            {parcelDemo
                              ? "Mô phỏng mở khóa thành công."
                              : "Hãy kiểm tra cửa ngăn tại tủ. Trạng thái nhận hàng được cập nhật sau khi hệ thống xác nhận."}
                          </Text>
                        )}
                      </>
                    )}
                    <View style={{ alignSelf: "stretch", gap: 12 }}>
                      <View style={styles.row}>
                        <Text style={{ fontSize: 22, color: colors.ink }}>⌁</Text>
                        <Text style={styles.muted}>Ưu tiên mở qua Internet / Server</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={{ fontSize: 22, color: colors.ink }}>ᛒ</Text>
                        <Text style={[styles.muted, { flex: 1 }]}>
                          Bluetooth: bản demo, chưa kết nối thiết bị
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.card, styles.between, { paddingHorizontal: 12 }]}>
                    {[
                      ["ready", "🔒"],
                      ["opening", "◌"],
                      ["failed", "×"],
                      ["sent", "✓"],
                    ].map(([value, symbol]) => (
                      <View key={value} style={{ flex: 1, alignItems: "center", gap: 8 }}>
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            borderWidth: 1.5,
                            borderColor:
                              value === "failed"
                                ? colors.red
                                : value === "sent"
                                  ? colors.green
                                  : colors.orange,
                            backgroundColor: state === value ? "#FFF0DE" : "white",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 26,
                              color:
                                value === "failed"
                                  ? colors.red
                                  : value === "sent"
                                    ? colors.green
                                    : colors.orange,
                            }}
                          >
                            {symbol}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 10,
                            textAlign: "center",
                            color: colors.ink,
                            fontWeight: state === value ? "700" : "400",
                          }}
                        >
                          {unlockLabel(value, parcelDemo)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              <Action
                secondary
                label={showMore ? "Thu gọn thông tin" : "Thông tin thêm & lịch sử"}
                onPress={() => setShowMore(!showMore)}
              />
              {showMore && (
                <View style={styles.card}>
                  <Text style={styles.heading}>Thông tin thêm</Text>
                  <Text style={styles.text}>
                    Shipper: {parcel.shipperName || "Chưa có thông tin"}
                    {"\n"}Điện thoại: {parcel.shipperPhone || "Chưa có thông tin"}
                    {"\n"}Lưu tối đa đến: {parcelDate(parcel.maxStorageUntil)}
                    {"\n"}Điểm nhận quá hạn: {parcel.lockerRecoveryAddress}
                  </Text>
                  <Text style={styles.heading}>Lịch sử trạng thái</Text>
                  {historyError ? (
                    <Text style={styles.muted}>{historyError}</Text>
                  ) : history.length ? (
                    history.map((item) => (
                      <View key={item.id}>
                        <Text style={styles.text}>{parcelStatusLabel(item.toStatus)}</Text>
                        <Text style={styles.muted}>
                          {parcelDate(item.changedAt)}
                          {item.reason ? ` · ${item.reason}` : ""}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.muted}>Chưa có lịch sử.</Text>
                  )}
                </View>
              )}
              <Action
                secondary
                label="Báo cáo sự cố"
                onPress={() =>
                  router.push({ pathname: "/incidents/new", params: { parcelId: parcel.id } })
                }
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
