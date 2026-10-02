import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Action, colors, OrangeHeader, ParcelArt, styles } from "@/features/parcels/parcel-ui";

export default function ReturnDemoScreen() {
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  return (
    <SafeAreaView style={styles.screen} edges={["left", "right"]}>
      <ScrollView>
        <OrangeHeader>
          <SafeAreaView edges={["top"]}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>Gửi hàng trả</Text>
          </SafeAreaView>
        </OrangeHeader>
        <View style={styles.body}>
          <Text style={styles.demo}>Bản demo · Chưa tạo yêu cầu trên hệ thống</Text>
          <View style={[styles.card, { alignItems: "center" }]}>
            <ParcelArt size={110} open />
            <Text style={styles.heading}>
              {submitted ? "Đã tạo yêu cầu mẫu" : "Thông tin hàng trả"}
            </Text>
            <Text style={[styles.muted, { textAlign: "center" }]}>
              {submitted
                ? `Mã đơn: ${code}\nĐây là kết quả mô phỏng; chưa giữ ngăn hay mở tủ thật.`
                : "Nhập mã đơn và lý do trả để xem thử luồng gửi hàng trả."}
            </Text>
          </View>
          {!submitted && (
            <View style={styles.card}>
              <Text style={styles.text}>Mã đơn hàng</Text>
              <TextInput
                accessibilityLabel="Mã đơn hàng"
                value={code}
                onChangeText={setCode}
                maxLength={100}
                placeholder="VD: PRC001234"
                placeholderTextColor={colors.muted}
                style={{
                  color: colors.ink,
                  borderWidth: 1,
                  borderColor: colors.line,
                  padding: 14,
                  borderRadius: 12,
                }}
              />
              <Text style={styles.text}>Lý do trả hàng</Text>
              <TextInput
                accessibilityLabel="Lý do trả hàng"
                value={note}
                onChangeText={setNote}
                maxLength={500}
                multiline
                placeholder="Nhập lý do trả hàng"
                placeholderTextColor={colors.muted}
                style={{
                  color: colors.ink,
                  borderWidth: 1,
                  borderColor: colors.line,
                  padding: 14,
                  borderRadius: 12,
                  minHeight: 90,
                  textAlignVertical: "top",
                }}
              />
              {error && <Text style={{ color: colors.red }}>{error}</Text>}
              <Action
                label="Tạo yêu cầu demo"
                onPress={() => {
                  if (!code.trim() || !note.trim()) {
                    setError("Vui lòng nhập mã đơn và lý do trả hàng.");
                    return;
                  }
                  setError("");
                  setSubmitted(true);
                }}
              />
            </View>
          )}
          <Action secondary label="Quay lại Trang chủ" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
