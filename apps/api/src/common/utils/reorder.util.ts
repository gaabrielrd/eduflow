import { BadRequestException, NotFoundException } from "@nestjs/common";

import type { ReorderItemDto } from "../dto/reorder-items.dto.js";

type ReorderableItem = {
  id: string;
  position: number;
};

type BuildReorderedActiveItemsOptions<TItem extends ReorderableItem> = {
  items: ReorderItemDto[];
  activeItems: TItem[];
  notFoundMessage: string;
};

export function buildReorderedActiveItems<TItem extends ReorderableItem>({
  items,
  activeItems,
  notFoundMessage
}: BuildReorderedActiveItemsOptions<TItem>) {
  const seenIds = new Set<string>();
  const seenPositions = new Set<number>();

  for (const item of items) {
    if (seenIds.has(item.id)) {
      throw new BadRequestException("duplicate item ids are not allowed");
    }

    if (seenPositions.has(item.position)) {
      throw new BadRequestException(
        "duplicate target positions are not allowed"
      );
    }

    seenIds.add(item.id);
    seenPositions.add(item.position);
  }

  const activeItemMap = new Map(activeItems.map((item) => [item.id, item]));

  for (const item of items) {
    if (!activeItemMap.has(item.id)) {
      throw new NotFoundException(notFoundMessage);
    }

    if (item.position > activeItems.length) {
      throw new BadRequestException("target position is out of range");
    }
  }

  const requestedItems = items
    .map((item) => ({
      requestedPosition: item.position,
      item: activeItemMap.get(item.id)!
    }))
    .sort(
      (left, right) =>
        left.requestedPosition - right.requestedPosition ||
        left.item.position - right.item.position ||
        left.item.id.localeCompare(right.item.id)
    );

  const requestedIds = new Set(requestedItems.map((item) => item.item.id));
  const reorderedActiveItems = activeItems.filter(
    (item) => !requestedIds.has(item.id)
  );

  for (const requestedItem of requestedItems) {
    reorderedActiveItems.splice(
      requestedItem.requestedPosition - 1,
      0,
      requestedItem.item
    );
  }

  return reorderedActiveItems;
}
