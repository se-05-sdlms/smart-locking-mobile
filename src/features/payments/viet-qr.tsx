import { Card, Typography } from "heroui-native";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export function VietQr({ code, amount }: { code: string; amount: number }) {
  return (
    <Card>
      <Card.Body className="items-center gap-4">
        <Typography.Heading>{new Intl.NumberFormat("vi-VN").format(amount)} VND</Typography.Heading>
        <View accessibilityLabel="Mã VietQR thanh toán" accessible className="bg-white p-4">
          <QRCode value={code} size={200} />
        </View>
        <Typography.Paragraph className="text-center">
          Quét bằng ứng dụng ngân hàng trên thiết bị khác, hoặc chụp màn hình và nhập ảnh QR trong
          ứng dụng ngân hàng nếu được hỗ trợ.
        </Typography.Paragraph>
        <Typography.Paragraph className="text-center">
          Boxora sẽ cập nhật khi máy chủ xác nhận thanh toán.
        </Typography.Paragraph>
      </Card.Body>
    </Card>
  );
}
