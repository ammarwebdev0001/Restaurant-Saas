export type AttrGroupRow = {
  id: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  required: boolean;
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
