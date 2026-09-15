import { Button, FieldError, InputGroup, Label, TextField } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import type { TextInputProps } from "react-native";

import { GravityIcon, type GravityIconName } from "@/components/icons/gravity-icon";

export function AuthField({
  label,
  icon,
  error,
  secureTextEntry,
  ...props
}: TextInputProps & { label: string; icon: GravityIconName; error?: string }): JSX.Element {
  const [visible, setVisible] = useState(false);
  const password = Boolean(secureTextEntry);
  return (
    <TextField isInvalid={Boolean(error)}>
      <Label>{label}</Label>
      <InputGroup>
        <InputGroup.Prefix isDecorative>
          <GravityIcon name={icon} />
        </InputGroup.Prefix>
        <InputGroup.Input {...props} secureTextEntry={password && !visible} />
        {password && (
          <InputGroup.Suffix>
            <Button
              isIconOnly
              size="sm"
              variant="tertiary"
              accessibilityLabel={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onPress={() => setVisible((value) => !value)}
            >
              <GravityIcon name={visible ? "eye-slash" : "eye"} />
            </Button>
          </InputGroup.Suffix>
        )}
      </InputGroup>
      {error && <FieldError>{error}</FieldError>}
    </TextField>
  );
}
