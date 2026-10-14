import { Button, Spinner } from "heroui-native";
import type { ReactElement, ReactNode } from "react";
import { FlatList, RefreshControl, View, type ListRenderItem } from "react-native";

import { ListFeedback } from "@/components/ui/list-feedback";
import { SafeAreaView } from "@/components/ui/themed-safe-area-view";
import { residentLayout } from "@/theme/tokens";
import type { GravityIconName } from "@/components/icons/gravity-icon";

export function ResidentFeed<T>({
  items,
  header,
  renderItem,
  keyExtractor,
  loading,
  refreshing,
  error,
  onRefresh,
  empty,
  icon,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  tab = false,
}: {
  items: T[];
  header: ReactNode;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  loading: boolean;
  refreshing: boolean;
  error: string;
  onRefresh: () => void;
  empty: string;
  icon: GravityIconName;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  tab?: boolean;
}): ReactElement {
  return (
    <SafeAreaView edges={tab ? ["top", "left", "right"] : ["left", "right", "bottom"]}>
      <FlatList
        data={loading ? [] : items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: residentLayout.horizontal,
          paddingTop: 16,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing && !loading} onRefresh={onRefresh} />
        }
        ListHeaderComponent={<View className="gap-4 pb-5">{header}</View>}
        ListEmptyComponent={
          <ListFeedback
            loading={loading}
            error={error}
            empty={empty}
            icon={icon}
            onRetry={onRefresh}
          />
        }
        ListFooterComponent={
          <View className="gap-3 py-4">
            {items.length > 0 && error ? (
              <ListFeedback
                loading={false}
                error={error}
                empty={empty}
                icon={icon}
                onRetry={onRefresh}
              />
            ) : null}
            {loadingMore ? (
              <Spinner accessibilityLabel="Đang tải thêm" />
            ) : hasMore && !error ? (
              <Button variant="ghost" onPress={onLoadMore}>
                <Button.Label>Tải thêm</Button.Label>
              </Button>
            ) : null}
          </View>
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
      />
    </SafeAreaView>
  );
}
