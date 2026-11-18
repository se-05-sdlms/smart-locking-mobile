import { Card, Typography } from "heroui-native";
import type { JSX } from "react";

import { AppScreen } from "@/components/ui/app-screen";

export function PlaceholderScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}): JSX.Element {
  return (
    <AppScreen>
      <Typography.Heading className="mb-5 text-3xl">{title}</Typography.Heading>
      <Card>
        <Card.Body>
          <Typography.Paragraph className="text-muted">{description}</Typography.Paragraph>
        </Card.Body>
      </Card>
    </AppScreen>
  );
}
