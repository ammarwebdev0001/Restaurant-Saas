export type AttrGroupRow = {
  id: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  required: boolean;
  minItems: number | null;
  maxItems: number | null;
  sortOrder: number;
  linkedCategory: { id: string; name: string };
};

export type MenuItemRow = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  salePrice: number | null;
  categoryId: string;
  updatedAt?: string;
  createdAt?: string;
  variations?: {
    id: string;
    name?: string;
    title?: string;
    imageUrl?: string | null;
    swatchHex: string | null;
    priceDelta: number;
    sortOrder: number;
  }[];
  attributeGroups: AttrGroupRow[];
  offersFromThis?: {
    id: string;
    sortOrder: number;
    offeredItem: {
      id: string;
      name: string;
      description: string | null;
      imageUrl: string | null;
      price: number;
      salePrice: number | null;
    };
  }[];
};

export type MenuCategoryRow = {
  id: string;
  name: string;
  items: MenuItemRow[];
};

export type RestaurantMenuData = {
  id: string;
  menus: MenuCategoryRow[];
};
